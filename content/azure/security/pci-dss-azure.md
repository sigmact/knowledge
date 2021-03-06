---
title: "PCI DSS 対応を踏まえたAzure上でセキュアなアプリケーションを作るベストプラクティス"
authors: [
    ["Takekazu Omi","images/author/omi.png"],
    ["Keiichi Hashimoto","images/author/k1hash.png"]
]
weight: 10
date: 2020-01-27
description: "この記事はトピック「Azure上でセキュアなアプリケーションを作るベストプラクティス」の中の一記事となります。本稿では、PCI DSS を紹介するとともに、Azure のテクノロジーを使って、どのように対応していくか、トピック内記事を読むためのアウトラインを紹介します。"
type : "article"
category : "azure"
tags: ["Azure", "セキュリティ","PCI DSS"]
eyecatch: "images/eyecatch/pcidss.png"
---

## はじめに

この記事はトピック[「Azure上でセキュアなアプリケーションを作るベストプラクティス」](/azure/security/)の中の一記事となります。
例として PCI DSS の要件を取り上げており、それぞれの要件と Azure での実装を解説していきます。

本稿では、PCI DSS を紹介するとともに、Azure のテクノロジーを使って、どのように対応していくか、トピック内記事を読むためのアウトラインを紹介します。

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

また、「PCI DSS の適応範囲は、PAN（カード会員番号）を扱っている部分であり、処理は、伝送、処理、保管を現す。」とあります。PCI DSS はカード会員番号のセキュリティ基準なのでこうなっていますが、**Web サイトのセキュリティを考えた場合、守るべき情報の定義、「伝送、処理、保管」で、どのように扱うべきかはもっとも重要な要件です。**

PCI DSS では、複数の要求レベルの異なったデータの扱いを明確化しています。「カード会員データとセンシティブ認証データの２つに分けて定義」する旨が記述され、カード会員データ（カード番号、有効期限、カード会員名、サービスコード）は、業務上の必要があれば保存可、センシティブ認証データ（CVV、磁気データ）は、処理後破棄、保存不可と明記されています。この部分が重要なのは、保存の可否を明文化していることです。保存不可のデータが処理上必要な場合は、都度外部から取得する必要があります。

それ以外にも、「カード会員データの保存、処理または伝送に関するビジネスニーズおよびプロセスを明確にし、データフロー図を使用してカード会員データフローを文書化するように」とあります。機密情報がどこでどのように扱われるのかを明文化して共有することは非常に重要です。

**ここで全体的に語られているのは、守るべき情報（守秘情報）を定義し、守秘情報のフロー、処理、ビジネス要件を明らかにすることの必要性と、範囲をなるべく狭くすることの有効性です。こららを考えると、「もしかして秘匿が必要になるかもしれないので、一緒に渡しておく」というような安易な考えで設計をするべきではありません。これは、拡張性、柔軟性とは相反する要件とも言えます。**

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

## Azure のセキュリティ基本

一通り PCI DSS を紹介してきましたので、ここでAzureのセキュリティに関する基本について紹介します。以下の2つの記事に目を通すと良いでしょう。既に把握している方は、先に読み進めて頂いて構いません。

- [Azureのセキュリティ「共有責任モデル」の利点とは](/azure/security/azure-security-shared-responsibility-model/)

- [Azure Blueprint: PaaS Web Application for PCI DSS とは](/azure/security/pci-dss-azure-blueprint/)

## Azure テクノロジーとセキュリティの概要

情報セキュリティ (CIA) 対策の方針に当て嵌めてみると、本システムでは、下記のような Azure のテクノロジーを実装に使っています。それぞれの Azure での実装と PCI DSS の要件と解説していきます。

[1. 認証、アクセス制御](/azure/security/pci-dss-azure-authorized-access-control/)

- Azure Active Directory、RBAC, SQL Database アクセス制御等

[2. 不正アクセス防止](/azure/security/pci-dss-azure-unauthorized-access-prevention/)

- ネットワーク分離(VNet, NSG, ExpressRoute), セキュリティパッチ適応(App Service)、暗号化、鍵管理（Azure Key Vault）

[3. 監査、ログ](/azure/security/pci-dss-azure-audit-logs/)

- Applicaiton Insights, Log Analytics

この順で見ていくと良いですが、興味のあるところに直接飛んで頂いても構いません。
また、

- [Azure上でセキュアなアプリケーションを作るベストプラクティス](/azure/security/)

に戻ることも出来ます。

## 参考

セキュリティ関連のおすすめリンク（本文未掲載）

- [Azure Security Documentation](https://docs.microsoft.com/en-us/azure/security/)
- [Design for security in Azure](https://docs.microsoft.com/en-us/learn/modules/design-for-security-in-azure/)
