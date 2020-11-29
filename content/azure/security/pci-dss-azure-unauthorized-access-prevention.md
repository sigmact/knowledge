---
title: "「不正アクセス(Unauthorized Access)防止」Azureでの PCI DSS 対応をまとめる(2)"
authors: [
    ["Takekazu Omi","images/author/omi.png"],
    ["Keiichi Hashimoto","images/author/k1hash.png"]
]
weight: 10
date: 2020-11-27
description: "この記事はトピック「Azure上でセキュアなアプリケーションを作るベストプラクティス」の中の一記事となります。本稿では、不正アクセス防止について取り上げます。"
type : "article"
category : "azure"
tags: ["Azure", "セキュリティ","KeyVault"]
eyecatch: "azure/security/images/08-attack.png"
---

## はじめに

この記事はトピック[「Azure上でセキュアなアプリケーションを作るベストプラクティス」](/azure/security/)の中の一記事となります。
例として PCI DSS の要件を取り上げており、それぞれの要件と Azure での実装を解説していきます。

本稿では、不正アクセス防止について取り上げます。

[1. 認証、アクセス制御](/azure/security/pci-dss-azure-authorized-access-control/)

- Azure Active Directory、RBAC, SQL Database アクセス制御等

2. 不正アクセス防止※本記事

- ネットワーク分離(VNet, NSG, ExpressRoute), セキュリティパッチ適応(App Service)、暗号化、鍵管理（Azure Key Vault）

[3. 監査、ログ](/azure/security/pci-dss-azure-audit-logs/)

- Applicaiton Insights, Log Analytics

## 不正アクセス(Unauthorized Access)防止

権限のないアクセス（Unauthorized Access）の防止において Azure と従来のオンプレでの最も大きな違いは、Azure 上では、多くのマネージドなセキュリティ機構が用意されており、サービスとして用意されているものを利用することで、多層防御が構築できると言う点です。

**すべて自分で用意するオンプレと比べて、顧客責務部分が限定され、複数のセキュリティ層を構成した場合の追加コストが少くなり、多層的なアーキテクチャを構築する自由度があがります。**

本システムでは、ネットワーク分離、セキュリティパッチの適応、暗号化などのセキュリティ技術を用いて多層防御(Defense in depth)を構成しています。異なったセキュリティ技術で階層的な防御層を構築することで、ある技術で見逃された攻撃が別の技術で見逃されないようにし、機密データ暴露までの時間を稼ぎます。多層防御と監視を組み合わせることで、効果的な不正アクセス防止を実装することができます。

本システムでは、ネットワーク分離に、[仮想ネットワーク](https://docs.microsoft.com/ja-jp/azure/virtual-network/virtual-networks-overview)、[Network Security Group](https://docs.microsoft.com/ja-jp/azure/virtual-network/security-overview)、[仮想ネットワーク サービス エンドポイント](https://docs.microsoft.com/ja-jp/azure/virtual-network/virtual-network-service-endpoints-overview)、[ExpressRoute](https://docs.microsoft.com/en-us/azure/expressroute/expressroute-introduction)を使います。既知の脆弱性からの防御には、[Application Gateway + Web Application Firewall](https://docs.microsoft.com/en-us/azure/application-gateway/overview)、[セキュリティパッチの自動化（App Service)](https://docs.microsoft.com/ja-jp/azure/app-service/overview-patch-os-runtime)を使います。
暗号化には、[通信の暗号化(tls 1.1/1.2)](https://docs.microsoft.com/ja-jp/azure/app-service/overview-security#https-and-certificates)、証明書、鍵、シークレト管理に、[Key Vault](https://docs.microsoft.com/en-in/azure/key-vault/key-vault-overview)、データの保護には、[SQL Database の暗号化](https://docs.microsoft.com/ja-jp/azure/sql-database/transparent-data-encryption-azure-sql)、[SQL Database の動的データ マスク](https://docs.microsoft.com/ja-jp/azure/sql-database/sql-database-dynamic-data-masking-get-started)などを利用しています。

### 多層防御(Definse in depth)

攻撃を受けた場合、多層的な防衛線([Defense in depth](https://docs.microsoft.com/en-us/learn/modules/design-for-security-in-azure/2-defense-in-depth))は効果的です。何からの問題で、防衛線の一部が脆弱な状態になっても複数あることで時間を稼ぐことができます。監視と多段防衛の両輪とすることで、驚異に対する抵抗力は劇的に向上します。

{{< figure src="../images/10-defense_in_depth_layersl.png" title="図7 Definse in depth" width="400" >}}

{{% pageinfo color="primary" %}}
TODO:図の説明が無い
{{% /pageinfo %}}

本システムでは、下記の用に、ネットワーク通信を制限、既知の脆弱性に対する対策、データの暗号化の多段防衛としています。

- ネットワーク分離

  - Azure Load Balancer のポート制限
  - VNet へのサービス配置
  - 役務毎のサブネットを割当て
  - サブネット間の通信の NSG 制限

- 既知の脆弱性からの防御

  - WAF(Application Gateway)
  - セキュリティパッチの自動化（PaaS）

- データの暗号化保存
  - 鍵管理は Key Vault を利用
  - SQL Database の暗号化を利用

### ネットワーク分離と通信制限

ネットワーク分離はよく使われる防御層なので、もう少し説明します。ネットワーク分離は、コストパフォマンスに優れた防御層として広く使われています。Azure では、マネージドサービスを使って分離を実装することができるので、追加コストを比較的少なく抑えることができます。今回は、VNet に PaaS をデプロイするために、[App Service Environment(ASE)](https://docs.microsoft.com/en-us/azure/app-service/environment/intro)を利用していますが、App Service の[Azure Virtual Network Integration](https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet) も検討してください。

分離は下記のようなレイヤーで実装しています。

- 仮想ネットワーク(VNet)で、専用のプライベートアドレス空間を用意し、外部からのアクセスを制限
- VNet へのアクセスは、Azure Load Balancer (L4)、Application Gateway 経由とする
- Subnet 間通信を Network Security Group (NSG)で必要なものだけに制限
- SQL Database 等のマネージド・サービスとの通信は、Virtual Network Service Endpoints で制限

Azure では、VNet にデプロイすることができるサービス、VNet Service Endpoint でアクセス制御できるサビース、それらをサポートしていないサービスがあるので設計時には確認が必要です。また、サービスでサポートしているサービスレベルの低いものは VNet Integration がサポートされていない場合があります。

### 暗号化 ー鍵管理

暗号化の課題は、暗号化アルゴリズムの強度だけではありません。暗号化鍵を適切に管理できていない場合、どのように強固な暗号化アルゴリズムを利用しても片手落ちであることは否めません。また、鍵管理には、適切なアクセス制御と監査ログが必要です。

Azure では、業界標準の暗号化アルゴリズムと、HSM(Hardware Security Module) をバックエンドに持った [Azure Key Vault](https://docs.microsoft.com/en-in/azure/key-vault/key-vault-overview) を利用することができます。

Key Vault を利用すると、管理プレーン、データプレーンのアクセス権、監査ログの設定で、鍵管理で必要な要件を
満たすことができます。適切に設定された、Key Vault で、シークレット、鍵を一元管理することで、アプリケーションの機密情報の保護を向上させることができます。

PCI DSS 要件 3,4 では、カード会員データを保存する時に、暗号化を選択している場合に鍵管理プロセスが求められています。Azure では鍵管理のコストが低いので、本システムではデータベースの接続情報、暗号化鍵、Service Principal が利用する証明書などを含めシステム上センシティブ情報となるものを Key Vault に保存しています。鍵管理を行うセキュリティオペレータを別途設けることで、システム上のセンシティブ情報を知るスタッフを減らすことができます。これは、情報の局在化による驚異の低減という効果があります。

**Key Vault は、オンプレでは高価だった HSM ベースの鍵管理が、クラウドによって費用対効果が大きく改善された例です。**

### 脅威分析

驚異分析は重要なポイントの１つです。驚異を分析し、軽減策を検討して、アーキテクチャ、アプリケーション、業務設計にフィードバックしていきます。ここに全部書くには数が多いので、驚異分析の結果から３つだけ抜粋して記述します。

{{< figure src="../images/08-attack.png" title="図8 驚異分析" width="800">}}

#### 1. Azure 管理

- 脅威：Azure の管理者権限を取得すると、NSG など Azue リソースの構成を変更することでアクセス権を得ることができる
- 軽減：
  - 通常業務の Azure アカウントと管理者アカウントを分け、最小権限の Azure アカウントで運用する
  - Azure アカウントの MFA を有効にする

#### 2. インターネットから Application Gateway へのアクセス

- 脅威：アカウントの偽装、脆弱性を使った特権の獲得
- 軽減：
  - https を利用し認証情報を保護
  - WAF による既知の脆弱性の対策
  - NSG による通信制御
  - ADD、RBAC による変更制限

#### 3. App Service Environment からデータベースへのアクセス

- 脅威：アカウント漏洩、脆弱性を使った特権の獲得
- 軽減：
  - ssl を利用したデータ保護
  - PaaS によるパッチ適応
  - NSG による通信制御
  - ADD、RBAC による変更制限
  - Key Vault によるデータベース接続情報の保護

## まとめ PCI DSS 要件との関係

### 要件1

要件 1 では、「カード会員データを保護するために、ファイアウォールをインストールして構成を維持する」として、要件を定めています。本システムでは、仮想ネットワーク、Application Gateway、NSG で複数層を構成することで、より厳重にカード会員データを分離、保護しています。SQL Database など、仮想ネットワーク外となるものは、VNet Service Endpoints でアクセスを制限します。

### 要件2

要件 2 では、「システムパスワードおよびその他のセキュリティパラメータにベンダ提供のデフォルト値を使用しない」とあります。これは、過去のインシデントの教訓からの要求事項でしょうが、Azure では、共通のセキュリティパラメータ（デフォルトパスワード）は存在しません。見落としによるデフォルト値の変更もれなどは、存在しえないため、より安全な運用を行うことができます。

### 要件7

要件 7 には「カード会員データへのアクセスを、業務上必要な範囲内に制限する」とあります。本システムは、Azure に配置され、外部へはインターネットに公開される Load Balancer のエンドポイントと企業ネットワークと接続される ExpressRoute の 2 点のみで接続されています。インターネットとの接続は、https(tls 1.1, 1.2)のみ、企業ネットワークと接続は業務限定された通信のみとしています。

企業ネットワーク側との接続は、信頼できるシステムとの限定された通信と、特定の業務端末のみに限定しています。本システムの運用管理者は、特定の端末から Azure 内の踏み台サーバー(Bastin/jumpbox)にログインして運用業務を行います。踏み台サーバーへのアクセスは、オペレータ毎に固有の ID にてログインして行い、監査ログに結果を残します。また、踏み台サーバーで行う業務が最低限になるように管理機能を用意しています。

さらに Azure 内は仮想ネットワークをサブネットに分割しサブネットへのアクセスを NSG で制限することで本システムのコンポーネント間をネットワーク分離しています。分離されたネットワークに単一役務のコンポーネントを配置し、サブネット間での通信を必要なもののみを許可、通信自体を暗号化することで機密データの入出力を保護しています。

例えば、"Azure PCI DSS PaaS アーキテクチャー" の、Applicaiton Gateway, ASE, Bastion は、それぞれ別々の固有のサブネットにデプロイされ、必要な通信だけを NSG で許可します。

このように、各サブネットには単一責務のコンポーネントのみを配置することでセキュリティ要件を単純、明確にすることができ、PCI DSS 要件で求められるカード会員データ、機密データのデータフローとの一致の確認が容易になるように設計しています。

### 次の記事

- [「監査、ログ」Azureでの PCI DSS 対応をまとめる(3)](/azure/security/pci-dss-azure-audit-logs/)

- [Azure上でセキュアなアプリケーションを作るベストプラクティス](/azure/security/)


## 参考

セキュリティ関連のおすすめリンク（本文未掲載）

- [Azure Security Documentation](https://docs.microsoft.com/en-us/azure/security/)
- [Design for security in Azure](https://docs.microsoft.com/en-us/learn/modules/design-for-security-in-azure/)
