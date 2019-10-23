---
title: "Azure上でセキュア・アプリケーションを作るベストプラクティスを突き詰め続ける"
authors: [
    ["Takekazu Omi","images/author/omi.png"],
    ["Keiichi Hashimoto","images/author/k1hash.png"]
]
weight: 10
date: 2019-08-18
description: PCI DSS要件をAzure PaaS上で実現した実例をもとに
type : "article"
keywords:
  - "word1"
  - "word2"
  - "word3"
eyecatch: "/images/pcidss.png"
---

## ベストプラクティスを突き詰め続ける

本稿では、Azure 上でアプリケーションを構築する開発者向け(元々は社内向け)に、セキュア・アプリケーションを構築する際のベストプラクティス的な内容をアップデートし続けていく事を目指しています。
特にこだわっていることとしては、PaaS、サーバーレスを使いこなし、元来人力で行う必要があったセキュリティ対策をより安全なクラウド側で実施していく事です。
セキュリティ対策の大半はクラウド側に任せて、アプリケーション内における対応に集中し、不完全な人力作業を排除し、開発に集中したいのです。

セキュリティの基準については、PCI DSS 準拠が求められるクレジットカードイシュアのカード会員システムを [Microsoft Azure](https://azure.microsoft.com/en-us/) 上で [PaaS](https://azure.microsoft.com/ja-jp/overview/what-is-paas/) を中心に作った際の事例を基にしています。
[PCI DSS](https://www.pcisecuritystandards.org/)は運用要件も大きく含むので、ここではテクノロジーカットにフォーカスして、PCI DSS 要件をユースケースとして紹介していきます。

アプリケーションを構築する業界、システムの種別によっては、PCI DSS 要件ほど厳密に対応しないケースもあると思います。
業界の要求度合いによっては、このベストプラクティスが全てではないので、持ちうるリソースを考慮して、最適な実現方法を選択するようにしましょう。

## 基本知識

まず基本知識について。話の流れとしては、「情報セキュリティの定義」、「クラウド上におけるセキュリティの利点」、「ブループリント」に触れながら、PCI DSS 要件に対する Azure 上での技術選択を解説していきます。

### 情報セキュリティの定義

情報セキュリティの定義は、頭⽂字を取って CIA として知られています。

- 機密性 (Confidentiality): 情報へのアクセスを認められた者だけが、アクセスできる状態とする
- 完全性 (Integrity): 情報が破壊、改ざん⼜は消去されていない状態を確保する
- 可⽤性 (Availability): 情報へのアクセスを認められた者が、必要時に中断することなく、情報及び関連資産にアクセスできる

この３つを軸に、Azure 上でどのように扱うかを説明して⾏きます。

{{< figure src="../images/01-cia.png" title="図1x JIS Q 27002(ISO/IEC 27002)" width="400" >}}

### クラウド上におけるセキュリティの利点

クラウド上におけるセキュリティの利点を理解することは、最も重要な基本知識の一つです。
この利点を活かすことができるかどうかで、プロジェクトの⾏く末は⼤きく変わってきます。

一番根幹となる重要なポイントは[共有責任モデル(Shared responsibility model)](https://docs.microsoft.com/ja-jp/azure/security/fundamentals/infrastructure#shared-responsibility-model)です。

{{< figure src="../images/02-srmodel.png" title="図2 共有責任モデル" width="800" >}}

この図では、オンプレミスとクラウド(IaaS 中心、PaaS 中心)で Microsoft(クラウドプロバイダー)と顧客側の責任がどのように共有されるか。また、利用モデルによって、責任分担がどのように変わるかをまとめています。

例えば、オンプレミス環境では、ユーザーが物理層（データセンター、ハードウェア、ネットワーク）、仮想化レイヤーからアプリケーションまで全てスタックを所有しています。
このモデルでは、すべてのレイヤーの脆弱性を攻撃者の悪⽤から ユーザー が保護する責任があります。ところがクラウドになるとその物理層は、Microsoft の責任部分となり、[PCI DSS に準拠している Microsoft](#mspicdssaoc)に任せる形になります。
続いて、サーバーの OS 自体については、IaaS の管理は、顧客側の責任となり、PaaS の場合は Microsoft の責任部分が増えます。

{{% pageinfo %}}
PCI DSS に準拠している Microsoft は、**PCI DSS 評価(AoC)** へのリンクにしたいが書き方が不明
{{% /pageinfo %}}

原則的には、物理は Microsoft の責任で、アプリケーションは顧客の責任、その間にある OS やミドルウェアは、IaaS だと顧客責任が多くなり、PaaS/SaaS だと顧客責任が少なくなると⾔った構成になっています。
この点からも PaaS/SaaS を活用したほうが、顧客側の責任範囲が小さくなり、アプリケーション自体のセキュリティ対策に集中できるというメリットが非常に大きいといえます。

小さな開発チームでも、PaaS/SaaS を活用すると、Microsoft と責任を適切に分担したセキュアなアプリケーションが作れるようになります。

我々が強く言いたいのは、セキュリティ投資はビジネスリスクとのバランスで決定される限られたリソースであることです。
クラウドにアプリケーションをホストすることで、物理やインフラに関わる責任をクラウドプロバイダーに移し、ユーザーはクラウドプロバイダーと責任を分担することができます。
また、クラウドベースのセキュリティ機能を利⽤して脅威の検出と対応にかかる時間を短縮することができ、ユーザーは⾃⼰の責任範囲(主にアプリケーション)にセキュリティ・リソースを集中、もしくは予算を他のビジネス優先事項に割り当てることが可能となります。
このクラウド上における共有責任モデルは、開発速度、品質、運用コストにも大きく貢献します。

時として、クラウドプロバイダーが提供するものとユーザーの要件にはギャップがあります。それを分析しユーザーがコントロール可能な領域、ビジネス要件、アーキテクチャー、実装、運⽤などのレイヤーで適切に対応きるようにすることが、クラウド上におけるアーキテクチャの重要検討事項です。

我々は、限られた顧客のリソースを最⼤限に活かすために、PaaS/SaaS を利⽤し Azure に最適化（＝クラウドネイティブ）した設計を取ること、Azure の進歩に合わせて更新し続けていく事を非常に大切にしています。

## Blueprint: PaaS Web Application for PCI DSS とは

PCI DSS に対応するアーキテクチャをゼロから考える必要はありません。Microsoft から、[PCI DSS のための PaaS Web アプリケーション](https://docs.microsoft.com/ja-jp/azure/security/blueprints/pcidss-paaswa-overview)(以下 本システムと呼びます) というドキュメントが公開されており、我々もそれを参考にしています。

本システム は、下記のような構成になっています。我々が構築した実際のサイトは企業ネットワークとの ExpressRoute 接続があるなど、もっと複雑な構成ですが、基本的な考え⽅は同じです。

{{< figure src="../images/03-arch.png" title="図3 Azure PCI DSS アークテクチャー" width="600" >}}

本システム の構成を簡単に説明します。まず、システム全体は[仮想ネットワーク](https://docs.microsoft.com/ja-jp/azure/virtual-network/virtual-networks-overview)に展開されます。左側のフロントから説明すると、公開エンドポイントを Applicaiton Gateway + WAF で保護し、Internal LB 経由で、AppService Environment (ASE)に接続します。

アプリケーションは ASE に展開され、バックエンドの[SQL Database](https://azure.microsoft.com/en-in/services/sql-database/)にデータを保存します。データベースとの通信は、暗号化され、[Virtual Network Service Endpoints](https://docs.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview) でエンドポイントを保護します。企業ネットワークとは[Express Route](https://azure.microsoft.com/ja-jp/services/expressroute/)で接続され、システム連携のため特定のシステム（システム連携相⼿）との通信を許可しています。また、運⽤管理⽤に踏み台サーバー(Bastion)が設置され、踏み台サーバーへのアクセスは Express Route 経由で特定の端末からのみのアクセスに制限された環境とします。そして、ログ、メトリックは、[Azure
Monitor](https://azure.microsoft.com/ja-jp/services/monitor/)に集約します。

システムは、仮想ネットワーク内の、[Network Security Group(NSG)](https://docs.microsoft.com/en-us/azure/virtual-network/security-overview)で保護されたサブネット内にコンポーネント毎に展開されます。

そして、NSG ではコンポーネント間の必要な通信だけを許可します。この分離⽅針は、PCI DSS で求められているものよりも厳格ですが、Azure では追加コストも低く容易に実装できるため積極的に活用しています。

本環境を構築するためのリソースは、GitHub で公開されています。[Securing PaaS deployments](https://docs.microsoft.com/en-us/azure/security/security-paas-deployments)。

## PCI DSS 3.2 の概要

> PCI データセキュリティスタンダード（PCI DSS：Payment Card Industry Data Security Standard）は、 クレジットカード情報および取り引き情報を保護するために 2004 年 12 月、JCB・American Express・Discover・マスターカード・VISA の国際ペイメントブランド 5 社が共同で策定した、クレジット業界におけるグローバルセキュリティ基準である。

ここで、既に話が出ている、PCI DSS 3.2 について簡単に概要を説明します。詳細は、[PCI Security Standards Council](https://www.pcisecuritystandards.org/about_us/) がドキュメントを [https://www.pcisecuritystandards.org/document_library](https://www.pcisecuritystandards.org/document_library) で公開していますので原典をダウンロードして確認してください。

[Wikipedia: PCI データセキュリティスタンダード](https://ja.wikipedia.org/wiki/PCI%E3%83%87%E3%83%BC%E3%82%BF%E3%82%BB%E3%82%AD%E3%83%A5%E3%83%AA%E3%83%86%E3%82%A3%E3%82%B9%E3%82%BF%E3%83%B3%E3%83%80%E3%83%BC%E3%83%89) より

PCI DSS 3.2.1 が、現在の最新です。PCI DSS には、セキュアなサービスを構築する上で必要なことのエッセンスが凝縮しています。クレジットカードを扱うすべての組織が守るべきセキュリティ基準であるというだけでなく、すべてのサービス事業者は、ここから、セキュアなサービスと現実的なセキュリティへの取り組みとバランスを学ぶことができます。

これは、PCI DSS はクレジットカードブランドが、クレジットカード番号を使った決済の手数料でビジネスをするという自分たちのビジネスモデルを守るために策定した **"セキュリティ基準"** であることから生まれた結果です。国際ペイメントブランドとしては、クレジットカードでの取引が減るほど高度な（実装コストが高い）セキュリティを要求すると手数料ビジネスという彼らのビジネスモデルの不利益となります。また、セキュリティ基準を低くした結果不正利用が増えた場合にも、クレジットカードの信頼性が失われ、ユーザーのカード利用が減ります。つまり、セキュリティ基準は高過ぎても、低すぎてもビジネス的な不利益となるという典型的事例の中で制定されたものです。この２つの問題を現実的な路線で収束させることが、PCI Security Standards Council に期待される役目であり、PCI データセキュリティスタンダード(PCI DSS)はその成果物です。このバランスは社会的な状況によって変動するため、定期的に内容は更新されています。

{{% pageinfo title="PCI DSS 評価(AoC)" color="info" %}}

Microsoft Azure では、年 1 回、認定 Qualified Security Assessor (QSA) による PCI DSS 評価を実施しています。監査人が審査するのは Azure 環境です。この審査には、インフラ、開発、運用、管理、サポート、および対象サービスの検証が含まれます。PCI DSS では、取引量に応じて 4 つのレベルのコンプライアンスが指定されています。Azure は PCI DSS Version 3.2 サービス プロバイダー レベル 1 (年間取引量が最も多く、600 万件を超える) 準拠として認定されています。

資料は、ここからダウンロードできます [マイクロソフトと PCI DSS](https://www.microsoft.com/ja-jp/TrustCenter/Compliance/PCI)

{{% /pageinfo %}}

### PCI DSS 3.2 序文から

PCI DSS には、12 の要件があり、そちらにばかり話が集中する傾向があるように思いますが、要件の前の部分に良いことがいろいろ書いてあります。それを紹介します。

#### ネットワークセグメンテーション

「ネットワークセグメンテーションは要件ではないが。ネットワークセグメンテーションの利用は、対象範囲の限定、評価コスト、PCI DSS コントロールの実施、維持のコスト及び難易度、組織のリスクを低減する」というふうにあり、これは多くのシステムでセキュリティの向上に適応できます。PCI DSS 曰く、多重防衛の１つとしてネットワークセグメンテーションを使うのは難易度、コスト的に優れてるのでお勧めというわけです。本稿のアーキテクチャでもネットワーク分離を積極的に利用しています。セキュリティの基本の一つは、分離です。分離して局所化することで現実的な対策が取れるようになります。

#### PCI DSS の適応範囲

また、「PCI DSS の適応範囲は、PAN（カード会員番号）を扱っている部分であり、処理は、伝送、処理、保管を現す。」とあります。PCI DSS はカード会員番号のセキュリティ基準なのでこうなっていますが、Web サイトのセキュリティを考えた場合、守るべく情報の定義、「伝送、処理、保管」で、どのように扱うべきかはもっとも重要な要件です。

PCI DSS では、複数の要求レベルの異なったデータの扱いを明確化しています。「カード会員データとセンシティブ認証データの２つに分けて定義」する旨が記述され、カード会員データ（カード番号、有効期限、カード会員名、サービスコード）は、業務上の必要があれば保存可、センシティブ認証データ（CVV、磁気データ）は、処理後破棄、保存不可と明記されています。この部分が重要なのは、保存の可否を明文化していることです。保存不可のデータが処理上必要な場合は、都度外部から取得する必要があります。

それ以外にも、「カード会員データの保存、処理または伝送に関するビジネスニーズおよびプロセスを明確にし、データフロー図を使用してカード会員データフローを文書化するように」とあります。機密情報がどこでどのように扱われるのかを明文化して共有することは非常に重要です。

ここで全体的に語られているのは、守るべき情報（守秘情報）を定義し、守秘情報のフロー、処理、ビジネス要件を明らかにすることの必要性と、範囲をなるべく狭くすることの有効性です。こららを考えると、もしかして必要になるかもしれないので、一緒に渡しておく的な安易な考えで設計をするべきではありません。これは、拡張性、柔軟性とは相反する要件とも言えます。

### PCI DSS の 12 要件

PCI DSS 3.2 では 6 カテゴリ、12 要件を定めています。ここでは、一覧だけを引用して、以降で随時参照します。

{{< table >}}
|                                          |                                                                                                       |
| ---------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| 安全なネットワークとシステムの構築と維持 | 1. カード会員データを保護するために、ファイアウォールをインストールして構成を維持する                 |
|                                          | 2. システムパスワードおよびその他のセキュリティパラメータにベンダ提供のデフォルト値を使用しない       |
| カード会員データの保護                   | 3. 保存されるカード会員データを保護する                                                               |
|                                          | 4. オープンな公共ネットワーク経由でカード会員データを伝送する場合、暗号化する                         |
| 脆弱性管理プログラムの維持               | 5. すべてのシステムをマルウェアから保護し、ウイルス対策ソフトウェアまたはプログラムを定期的に更新する |
|                                          | 6. 安全性の高いシステムとアプリケーションを開発し、保守する                                           |
| 強力なアクセス制御手法の導入             | 7. カード会員データへのアクセスを、業務上必要な範囲内に制限する                                       |
|                                     | 8. システムコンポーネントへのアクセスを識別・認証する |
|                                          | 9. カード会員データへの物理アクセスを制限する                                                         |
| ネットワークの定期的な監視およびテスト   | 10. ネットワークリソースおよびカード会員データへのすべてのアクセスを追跡および監視する                |
|                                          | 11. セキュリティシステムおよびプロセスを定期的にテストする                                            |
| 情報セキュリティポリシーの維持           | 12. すべての担当者の情報セキュリティに対応するポリシーを維持する                                      |
{{< /table >}}

{{% pageinfo  %}}
TODO: まとめを記載する
{{% /pageinfo %}}

## Azure テクノロジーとセキュリティの概要

情報セキュリティ (CIA) 対策の方針に当て嵌めてみると、本システムでは、下記のような Azure のテクノロジーを実装に使っています。それぞれの Azure での実装と PCI DSS の要件と解説していきます。

1. 認証、アクセス制御

- Azure Active Directory、RBAC, SQL Database アクセス制御等

2. 不正アクセス防止

- ネットワーク分離(VNet, NSG, ExpressRoute), セキュリティパッチ適応(App Service)、暗号化、鍵管理（Azure Key Vault）

3. 監査、ログ

- Applicaiton Insights, Log Analytics

この順で見ていきましょう。

## 1. 認証、アクセス制御

Azure で従来のオンプレのセキュリティモデルと異なっていて、もっとも重要な点は。セキュリティの基本が、[Zero Trust, Id Based Security](https://www.microsoft.com/security/blog/2018/12/17/zero-trust-part-1-identity-and-access-management/)となっていることです。本システムでは、Azure 自体が、Id Based Security であるとともに、アプリケーションアーキテクチャ全体を、Id Based Security で保護します。また、全ては信頼できない（Zero Trust）という考えが基本にあります。つまり、内部ネットワークといえども信頼せず、認証し事前に定義されたアクセスだけを許可するという考えです。本システムは、外向きだけでは無く企業ネットワーク側にも同一の方針を取り、システムへのアクセス全てを認証、アクセス制御で保護しています。

Azure のリソースはどのように保護されているのでしょうか。Azure 上にサービスを展開すると下図のような構成になります。一番下が、Azure の基盤層、その上に Azure のリソース層が乗り、更に上にユーザーが作成したアプリケーションが乗ります。俗にインフラと言われる部分は下２層、その上はアプリケーションです。

{{< figure src="../images/05-3layer.png" title="図4 デプロイの3層構造" width="600" >}}

Azure リソースの操作は、Azure AD で認証されたオペレータが、Azure Resource Manager 経由で行います。操作は、RBAC に基づいて可否を判定され、操作履歴が[Activity Log](https://docs.microsoft.com/en-us/azure/azure-monitor/platform/activity-logs-overview)として保存されます。リソースの操作権限を RBAC で定義しておくことで、アクセスを制御します。さらに、操作は API が提供されており、スクリプト化が出来ます。

{{< figure src="../images/06-aadrbac.png" title="図5 AAD/RBAC/Resources" width="600">}}

ここで、重要なのは、ネットワーク設定、サーバー設定などのインフラ作業が、認証とアクセスコントロールに基づいて行われ、操作履歴が監査ログとして保存できること、さらに自動化（コード化）可能なことです。これらの特徴は、PCI DSS 要件の実装を助けてくれます。

### 踏み台サーバー

企業ネットワークからの運用業務のアクセスの管理のため踏み台サーバーを置いています。運用操作は必ず踏み台サーバーを経由することで、運用管理者の認証とアクセスを制御を実現します。必要な場合は、踏み台サーバから、データーベースに接続することができます。その場合も、オペレータの権限で、参照可能なテーブルやカラムを制限するなどが可能です。このあたりの制限は運用要件に応じて決めます。さらに、SQL Database の監査を併用することで、広いカバレッジの監査を実装しています。

{{< figure src="../images/07-bastin.png" title="図6 踏み台サーバー" width="600">}}

### PCI DSS 要件との関連

PCI DSS 3.2 では、要件 7 と 8 が認証とアクセス制御に相当します。そこでは、必要最低限のアクセス許可とすること、アカウントは共有せず、必ず個別のアカウントを割り当てること、ID パスワードの適切な管理などが要求されています。

本システムでは、業務アカウントには、Azure AD を使い。各個人に個別のアカウントを発行、RBAC で必要最低限のアクセスに制限することで要件を満たします。

要件 9 は、物理的なアクセス制御に関するものです。Azure では、物理アクセスは許可されておらず、[Azure REST API](https://docs.microsoft.com/en-us/rest/api/azure/)経由でのリソースの操作となります。API は、認証とアクセス制御に従います。これは、ID 管理は顧客責任で、API のアクセス制御はクラウドプロバイダーの責務となる、共同責任の一例です。

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

## 2. 不正アクセス(Unauthorized Access)防止

権限のないアクセス（Unauthorized Access）の防止において Azure と従来のオンプレでの最も大きな違いは。Azure 上では、多くのマネージドなセキュリティ機構が用意されており、サービスとして用意されているものを利用することで、多層防御が構築できると言う点です。すべて自分で用意するオンプレと比べて、顧客責務部分が限定され、複数のセキュリティ層を構成した場合の追加コストが少くなり、多層的なアーキテクチャを構築する自由度があがります。

本システムでは、ネットワーク分離、セキュリティパッチの適応、暗号化などのセキュリティ技術を用いて多層防御(Defense in depth)を構成しています。異なったセキュリティ技術で階層的な防御層を構築することで、ある技術で見逃された攻撃が別の技術で見逃されないようにし、機密データ暴露までの時間を稼ぎます。多層防御と監視を組み合わせることで、効果的な不正アクセス防止を実装することができます。

本システムでは、ネットワーク分離に、[仮想ネットワーク](https://docs.microsoft.com/ja-jp/azure/virtual-network/virtual-networks-overview)、[Network Security Group](https://docs.microsoft.com/ja-jp/azure/virtual-network/security-overview)、[仮想ネットワーク サービス エンドポイント](https://docs.microsoft.com/ja-jp/azure/virtual-network/virtual-network-service-endpoints-overview)、[ExpressRoute](https://docs.microsoft.com/en-us/azure/expressroute/expressroute-introduction)を使い。既知の脆弱性からの防御には、[Application Gateway + Web Application Firewall](https://docs.microsoft.com/en-us/azure/application-gateway/overview)、[セキュリティパッチの自動化（App Service)](https://docs.microsoft.com/ja-jp/azure/app-service/overview-patch-os-runtime)を使います。
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

Key Vault は、オンプレでは高価だった HSM ベースの鍵管理が、クラウドによって費用対効果が大きく改善された例です。

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

### PCI DSS 要件との関係

要件 1 では、「カード会員データを保護するために、ファイアウォールをインストールして構成を維持する」として、要件を定めています。本システムでは、仮想ネットワーク、Application Gateway、NSG で複数層を構成することで、より厳重にカード会員データを分離、保護しています。SQL Database など、仮想ネットワーク外となるものは、VNet Service Endpoints でアクセスを制限します。

要件 2 では、「システムパスワードおよびその他のセキュリティパラメータにベンダ提供のデフォルト値を使用しない」とあります。これは、過去のインシデントの教訓からの要求事項でしょうが、Azure では、共通のセキュリティパラメータ（デフォルトパスワード）は存在しません。見落としによるデフォルト値の変更もれなどは、存在しえないため、より安全な運用を行うことができます。

要件 7 には「カード会員データへのアクセスを、業務上必要な範囲内に制限する」とあります。本システムは、Azure に配置され、外部へはインターネットに公開される Load Balancer のエンドポイントと企業ネットワークと接続される ExpressRoute の 2 点のみで接続されています。インターネットとの接続は、https(tls 1.1, 1.2)のみ、企業ネットワークと接続は業務限定された通信のみとしています。

企業ネットワーク側との接続は、信頼できるシステムとの限定された通信と、特定の業務端末のみに限定しています。本システムの運用管理者は、特定の端末から Azure 内の踏み台サーバー(Bastin/jumpbox)にログインして運用業務を行います。踏み台サーバーへのアクセスは、オペレータ毎に固有の ID にてログインして行い、監査ログに結果を残します。また、踏み台サーバーで行う業務が最低限になるように管理機能を用意しています。

さらに Azure 内は仮想ネットワークをサブネットに分割しサブネットへのアクセスを NSG で制限することで本システムのコンポーネント間をネットワーク分離しています。分離されたネットワークに単一役務のコンポーネントを配置し、サブネット間での通信を必要なもののみを許可、通信自体を暗号化することで機密データの入出力を保護しています。

例えば、"Azure PCI DSS PaaS アーキテクチャー" の、Applicaiton Gateway, ASE, Bastion は、それぞれ別々の固有のサブネットにデプロイされ、必要な通信だけを NSG で許可します。

このように、各サブネットには単一責務のコンポーネントのみを配置することでセキュリティ要件を単純、明確にすることができ、PCI DSS 要件で求められるカード会員データ、機密データのデータフローとの一致の確認が容易になるように設計しています。

## 3. 監査、ログ、監視

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

### PCI DSS 要件との関係

PCI DSS の要件 10 では、「ネットワークリソースおよびカード会員データへのすべてのアクセスを追跡および監視する」としています。Azure リソースに関しては、操作が Activity Log に入るので監査ログとして保存できます。SQL Database のアクセスも監査ログを Log Analytics に保存することができます。本システムでは、その他に業務端末での操作を Log Analytics に保存しています。

また、「少なくとも１年は保管、最低 3 ヶ月間はオンラインで閲覧利用できるようにする」とあり、Log Analytics のリテンション期間を要件に合わせて設定しています。

## 最後に

ここでは、PCI DSS をユースケースとしましたが、Azure 上では、監査ログ、暗号化のコストは非常に低く、PCI DSS に関わらず下記項目は検討することを推薦します。システムの複雑化による追加コストは、思ったより大きくなく、メリットは大きいです。

- 本番環境では、Log Analytics への Activity Log の保存はデフォルトで設定する。リソースの Metrics、Log も同様
- SQL Database TDE は、CPU 負荷などの問題を確認して導入する
- Key Vault も導入コストはあまり高くないので入れて、監査ログを取る
- 本番のサブスクリプション、リソースグループにアクセス権がある Azure AD アカウントを限定し権限を絞る
- 本番のシークレトに触れる Azure AD アカウントを限定する

ネットワーク分離は、安いサービスで使えない場合が多いのでコストと合わせて随時検討してください。機密情報を限定して、必要な部分だけネットワーク分離を導入するというアプローチもあります。

## 参考

セキュリティ関連のおすすめリンク（本文未掲載）

- [Azure Security Documentation](https://docs.microsoft.com/en-us/azure/security/)
- [Design for security in Azure](https://docs.microsoft.com/en-us/learn/modules/design-for-security-in-azure/)
