---
title: "「認証、アクセス制御」Azureでの PCI DSS 対応をまとめる(1)"
authors: [
    ["Takekazu Omi","images/author/omi.png"],
    ["Keiichi Hashimoto","images/author/k1hash.png"]
]
weight: 10
date: 2020-11-26
description: "Azure 上でアプリケーションを構築する開発者向け(元々は社内向け)に、セキュア・アプリケーションを構築する際のベストプラクティス的な内容をアップデートし続けていく事を目指しています。"
type : "article"
category : "azure"
tags: ["Azure", "セキュリティ","KeyVault"]
eyecatch: "azure/security/images/05-3layer.png"
---

## はじめに

この記事は連載「Azure上でセキュアなアプリケーションを作るベストプラクティス」の中の一記事となります。
例として PCI DSS の要件を取り上げており、それぞれの要件と Azure での実装を解説していきます。

1. 認証、アクセス制御※本記事

- Azure Active Directory、RBAC, SQL Database アクセス制御等

[2. 不正アクセス防止](/azure/security/pci-dss-azure-unauthorized-access-prevention/)

- ネットワーク分離(VNet, NSG, ExpressRoute), セキュリティパッチ適応(App Service)、暗号化、鍵管理（Azure Key Vault）

[3. 監査、ログ](/azure/security/pci-dss-azure-audit-logs/)

- Applicaiton Insights, Log Analytics

## 認証、アクセス制御

Azure で従来のオンプレのセキュリティモデルと異なっていて最も重要な点は、セキュリティの基本が、[Zero Trust, Id Based Security](https://www.microsoft.com/security/blog/2018/12/17/zero-trust-part-1-identity-and-access-management/)となっていることです。

**本システムでは、Azure 自体が、Id Based Security であるとともに、アプリケーションアーキテクチャ全体を、Id Based Security で保護します。また、全ては信頼できない（Zero Trust）という考えが基本にあります。つまり、内部ネットワークといえども信頼せず、認証し事前に定義されたアクセスだけを許可するという考えです。**

本システムは、外向きだけでは無く企業ネットワーク側にも同一の方針を取り、システムへのアクセス全てを認証、アクセス制御で保護しています。

Azure のリソースはどのように保護されているのでしょうか。Azure 上にサービスを展開すると下図のような構成になります。一番下が、Azure の基盤層、その上に Azure のリソース層が乗り、更に上にユーザーが作成したアプリケーションが乗ります。俗にインフラと言われる部分は下２層、その上はアプリケーションです。

{{< figure src="../images/05-3layer.png" title="図4 デプロイの3層構造" width="600" >}}

Azure リソースの操作は、Azure AD で認証されたオペレータが、Azure Resource Manager 経由で行います。操作は、RBAC に基づいて可否を判定され、操作履歴が[Activity Log](https://docs.microsoft.com/en-us/azure/azure-monitor/platform/activity-logs-overview)として保存されます。リソースの操作権限を RBAC で定義しておくことで、アクセスを制御します。さらに、操作は API が提供されており、スクリプト化が出来ます。

{{< figure src="../images/06-aadrbac.png" title="図5 AAD/RBAC/Resources" width="600">}}

**ここで、重要なのは、ネットワーク設定、サーバー設定などのインフラ作業が、認証とアクセスコントロールに基づいて行われ、操作履歴が監査ログとして保存できること、さらに自動化（コード化）可能なことです。これらの特徴は、PCI DSS 要件の実装を助けてくれます。**

### 踏み台サーバー

企業ネットワークからの運用業務のアクセスの管理のため踏み台サーバーを置いています。運用操作は必ず踏み台サーバーを経由することで、運用管理者の認証とアクセスを制御を実現します。必要な場合は、踏み台サーバから、データーベースに接続することができます。その場合も、オペレータの権限で、参照可能なテーブルやカラムを制限するなどが可能です。このあたりの制限は運用要件に応じて決めます。さらに、SQL Database の監査を併用することで、広いカバレッジの監査を実装しています。

{{< figure src="../images/07-bastin.png" title="図6 踏み台サーバー" width="600">}}

### PCI DSS 要件との関連

PCI DSS 3.2 では、要件 7 と 8 が認証とアクセス制御に相当します。そこでは、必要最低限のアクセス許可とすること、アカウントは共有せず、必ず個別のアカウントを割り当てること、ID パスワードの適切な管理などが要求されています。

本システムでは、業務アカウントには、Azure AD を使い。各個人に個別のアカウントを発行、RBAC で必要最低限のアクセスに制限することで要件を満たします。

要件 9 は、物理的なアクセス制御に関するものです。Azure では、物理アクセスは許可されておらず、[Azure REST API](https://docs.microsoft.com/en-us/rest/api/azure/)経由でのリソースの操作となります。API は、認証とアクセス制御に従います。**これは、ID 管理は顧客責任で、API のアクセス制御はクラウドプロバイダーの責務となる、共同責任の一例です。**

要件 10 のカード会員データの監査ログ管理に関連する要件は、Activity Log 並びに、業務アカウントでの操作履歴を、[Log Analytics](https://docs.microsoft.com/en-us/azure/azure-monitor/log-query/get-started-portal) に監査上必要な期間保存することで満たしています。

### まとめ

- リソースの構成、設定は、AAD 認証下で行われる
- AAD 認証と連動してアクセス制御（RBAC)される
- リソース操作はコードで実施できる
- 操作は Log Analytics に保存される

このような仕組みとすることで、PCI DSS で必要な下記の項目の運用困難性が著しく下がります。

- 不正な構成変更の監査
- 構成基準の明確化
- 定期な構成確認の現実的な実行

さらに、Azure リソースには固定デフォルトパスワードは無く、PCI DSS 要件 2 のデフォルトパスワード使用禁止も該当しません。このあたりは、業界の最新のセキュリティ思想に基づいたサービス設計と言え、PCI DSS 準拠の環境構築を容易にしてくれます。

### 課題

レガシーなシステムとの連携に置いて、 認証、アクセス制御が適応できない場合があります。その場合は、代替策として中継サーバーの設置、IP アドレス固定などの方策を取りますが、驚異分析、多重防御の原則が守られるように十分注意が必要です。

### 次の記事

- [不正アクセス(Unauthorized Access)防止」Azureでの PCI DSS 対応をまとめる(2)](/azure/security/pci-dss-azure-unauthorized-access-prevention/)

- [Azure におけるセキュリティTOP](/azure/security/)


## 参考

セキュリティ関連のおすすめリンク（本文未掲載）

- [Azure Security Documentation](https://docs.microsoft.com/en-us/azure/security/)
- [Design for security in Azure](https://docs.microsoft.com/en-us/learn/modules/design-for-security-in-azure/)
