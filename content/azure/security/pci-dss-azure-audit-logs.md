---
title: "「監査、ログ」Azureでの PCI DSS 対応をまとめる(3)"
authors: [
    ["Takekazu Omi","images/author/omi.png"],
    ["Keiichi Hashimoto","images/author/k1hash.png"]
]
weight: 10
date: 2020-11-28
description: "Azure 上でアプリケーションを構築する開発者向け(元々は社内向け)に、セキュア・アプリケーションを構築する際のベストプラクティス的な内容をアップデートし続けていく事を目指しています。"
type : "article"
category : "azure"
tags: ["Azure", "セキュリティ","KeyVault"]
eyecatch: "azure/security/images/09-log.png"
---

## はじめに

この記事は連載「Azure上でセキュアなアプリケーションを作るベストプラクティス」の中の一記事となります。
例として PCI DSS の要件を取り上げており、それぞれの要件と Azure での実装を解説していきます。

[1. 認証、アクセス制御](/azure/security/pci-dss-azure-authorized-access-control/)

- Azure Active Directory、RBAC, SQL Database アクセス制御等

[2. 不正アクセス防止](/azure/security/pci-dss-azure-unauthorized-access-prevention/)

- ネットワーク分離(VNet, NSG, ExpressRoute), セキュリティパッチ適応(App Service)、暗号化、鍵管理（Azure Key Vault）

3. 監査、ログ※本記事

- Applicaiton Insights, Log Analytics

## Azure 「監査、ログ」 ログの種類とログストアの特徴

Azure では、主に３種類のログがあり、Application Insights と、Log Analytics という、２つのログストアが用意されています。

- Application Log
- Diagnostics Log(診断ログ）
- Activity Log

{{< figure src="../images/09-log.png" title="図9 Azure ログの種類" width="800" >}}

### Application Log

アプリケーションによって生成されたログ、Application Insights のクライアントライブラリによってインスツルメント、あるいはコードで明示的にロギングされます。

### Diagnostics Log(診断ログ）

リソースの生成するログ、リソース内で診断ログが生成されます。仮想マシンでは、ゲスト OS からログを収集する仕組みがあります。[Supported services, schemas, and categories for Azure Diagnostic Logs](https://docs.microsoft.com/ja-jp/azure/monitoring-and-diagnostics/monitoring-diagnostic-logs-schema)

### Activity Log

主に Azure Resource Manager で発生したアクティビティを記録します。リソースの作成、更新、削除や。正常性について情報が含まれます。

- Tenant log: Azure AD など Subscription の外側で生成されるログ
- Resource log: NSG や、Storage など Resources が生成するログ

### Azure ログストアの特徴

Application Insights と、Log Analytics という、２つのログストアは、同じクエリ言語（KQL）で、複数のログストを結合して問い合わせをすることもできます。これらのログストアは、非常に柔軟に参照可能で監査だけで無く運用ツールとしても優れています。また、RBAC によってアクセス可、不可を制御出来ます。

{{< figure src="../images/11-kql.png" title="図10 KQLの利用例" width="800" >}}

この２つのログストアは追記とリテンションルールに従った削除だけをサポートしており、一旦書き込んだものは改竄することが出来ません。ただし、GDPR 要件によってパージ（削除）ができるので注意が必要です。このパージは別権限になっており、通常はパージ権限を落としたユーザーで運用するようにします。パージ操作は、Activity Log に記録され、監査ログとして保存されます。

### PCI DSS 要件10との関係

PCI DSS の要件 10 では、「ネットワークリソースおよびカード会員データへのすべてのアクセスを追跡および監視する」としています。Azure リソースに関しては、操作が Activity Log に入るので監査ログとして保存できます。SQL Database のアクセスも監査ログを Log Analytics に保存することができます。本システムでは、その他に業務端末での操作を Log Analytics に保存しています。

また、「少なくとも１年は保管、最低 3 ヶ月間はオンラインで閲覧利用できるようにする」とあり、Log Analytics のリテンション期間を要件に合わせて設定しています。

## まとめ

ここでは、PCI DSS をユースケースとしましたが、Azure 上では、監査ログ、暗号化のコストは非常に低く、PCI DSS に関わらず下記項目は検討することを推薦します。システムの複雑化による追加コストは、思ったより大きくなく、メリットは大きいです。

- 本番環境では、Log Analytics への Activity Log の保存はデフォルトで設定する。リソースの Metrics、Log も同様
- SQL Database TDE は、CPU 負荷などの問題を確認して導入する
- Key Vault も導入コストはあまり高くないので入れて、監査ログを取る
- 本番のサブスクリプション、リソースグループにアクセス権がある Azure AD アカウントを限定し権限を絞る
- 本番のシークレトに触れる Azure AD アカウントを限定する

### 最後に

ネットワーク分離は、比較的コストがかかるケースがあるので、利用可能なコストと脅威のバランスを随時検討してください。機密情報を限定して、必要な部分だけネットワーク分離を導入するというアプローチもあります。

### 次の記事

- [Azure におけるセキュリティTOP](/azure/security/)


## 参考

セキュリティ関連のおすすめリンク（本文未掲載）

- [Azure Security Documentation](https://docs.microsoft.com/en-us/azure/security/)
- [Design for security in Azure](https://docs.microsoft.com/en-us/learn/modules/design-for-security-in-azure/)
