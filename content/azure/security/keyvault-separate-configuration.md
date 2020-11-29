---
title: "「アプリケーションと設定情報の分離」App Settings, App Configuration, KeyVault の違いを解説"
weight: 20
date: 2019-10-25
description: "Microsoft Azureで、アプリケーションで使われるセンシティブ情報(パスワード等)の保護のベストプラクティスについて書いています。本稿は、アプリケーションと設定ファイルの分離の必要性のおさらい、これまでどのようなアプローチが取られてきたか、また分ける基準、「アプリケーションと設定情報の分離」Azure App Service の App Settings, App Configuration, KeyVault の違いを詳細に解説します。"
authors: [
    ["Takekazu Omi","images/author/omi.png"],
    ["Keiichi Hashimoto","images/author/k1hash.png"]
]
type : "article"
category : "azure"
tags: ["Azure", "セキュリティ","KeyVault"]
eyecatch: "azure/security/images/config03.png"
---

## はじめに

この記事はトピック[「Azure上でセキュアなアプリケーションを作るベストプラクティス」](/azure/security/)の中の一記事となります。

本稿は、アプリケーションと設定ファイル分離の必要性のおさらい、これまでどのようなアプローチが取られてきたか、また分ける基準、「アプリケーションと設定情報の分離」Azure App Service の App Settings, App Configuration, KeyVault の違いを詳細に解説します。

## アプリケーションと設定ファイル(Configuration)の分離

以前より、環境依存設定はソースファイルに直接記述せずに、外部の設定ファイルに記述し実行時に読み込むのが良いとされてきました。例えば、データベースを使う場合のホスト名、データーベース名、Redis ホスト名等は、開発環境と本番環境で違います。これらの、環境依存の設定情報はハードコードせずにローカルファイルの設定ファイルに記述します。（残念ながら、未だにソースコードにハードコードされてる場合があるようですが）

アプリケーションと設定ファイルで分離されていれば、デプロイの際に設定ファルを切り替えて、開発環境では「アプリケーション＋開発用の設定ファイル」、本番環境では「アプリケーション＋本番用の設定ファイル」とすることで、必要なものがデプロイできます。分離の利点は数多くありますが、特に重要と考えるのは、「環境毎にアプリケーション本体を修正する必要が無い、ソースコード管理からセンシティブ情報情報を除外できる、アプリケーションバイナリを解析してセンシティブ情報を抜き出される危険性が無い」などの点です。この方法では、デプロイ後の設定ファイルはインスタンス内のインターネット非公開の場所に配置されることで保護されます。

ローカルファイル方式の特徴でもあり問題でもある点は、アプリケーションと設定ファイルが纏めてデプロイされることです。そのため、デプロイ（もしくは、パッケージの作成者）は、本番用の設定ファイルを参照することができ、同時にセンシティブ情報も参照することが可能となります。（これを避けるためには、設定ファイルの一部を暗号化するなどの方法が取られます、上記 OWASP Chatsheet参照）

この状態だとデプロイを自動化しても、CI/CDの設定をする時や、CI/CDでエラーになったときの調査でセンシティブ情報を見ることが出来てしまいます。CI/CDについては、参照、[Azure DevOps Projects を使用して既存のコードの CI/CD パイプラインを作成する](https://docs.microsoft.com/en-us/azure/devops-project/azure-devops-project-github)

{{< figure src="../images/config01.png" title="図１ アプリケーションと設定ファイルの関係" width="800" >}}

設定ファイルの中には、アプリケーションを構成の補助情報、環境依存情報、センシティブ情報などが一体となって書かれていて、それが運用時にアクセス可能な状態になるというわけです。ここでは、アプリのデプロイと設定のデプロイが１つになっています。

## App Service の App Settings

より進んだ方法として、[Azure App Service](https://docs.microsoft.com/en-in/azure/app-service/overview)では、[App Settings](https://docs.microsoft.com/en-us/azure/app-service/configure-common) が用意されています。App Settingsでは、Azure Portal や、API経由 (例：[Web Apps - Get Configuration](https://docs.microsoft.com/en-us/rest/api/appservice/webapps/getconfiguration))で設定が行われ、設定内容はアプリケーション内から環境変数として参照できます。この仕組を使うと、アプリケーションのデプロイと設定を別々に行うことができるというのが大きな違いです。これは、The Twelve Factors. の [III. Config Store/config in the environment](https://12factor.net/config) でもベストプラクティスに入っている考え方でもあります。

{{< figure src="../images/config02.png" title="図２ アプリケーションと構成情報の分離" width="600" >}}

こうすると、本番や開発などの別々のWeb Siteに「App Settingsに環境固有の設定をする」、「アプリケーションをデプロイする」と設定、デプロイ別の手順で分けて実行することができます。また、App Settings の別の利点として、サービスが複数のインスタンスにスケールした時にも設定を一箇所で管理できるという点があります。これは、従来のシステムで要件して重要視されることは（あまり）ありませんでしたが、クラウドの利点を活かすためには重要な要件です。このようにアプリケーションと設定を分離し共有する方法は、[External Configuration Store pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/external-configuration-store) として知られています。

App Settings のような方法は、「アプリケーション＋設定ファイル」で一つのパッケージとして扱うよりも格段に優れた方法（特にクラウド環境では）ですが、セキュリティという面では、設定にセンシティブなものとそうでないものの区別が無く、設定のどこ項目を誰が見れるかなどの設定ができないという点で不十分です。この区別が無いために、設定を確認できる人＝センシティブ情報にアクセス出来る人となってしまいます。セキュリティ面から言うと、センシティブ情報にアクセスできる人は少ないほど良い（運用難易度が低い）と言えるので、この点は良くありません。

{{% pageinfo color="primary" %}}
**センシティブ情報にアクセスできる人は少ないほど良い**

例えば、PCI DSS 3.2.1 要件 3.6.5 に下記のようにあります。

- 「平文暗号化鍵の知識を持つ従業員が離職したなど、」鍵の整合性が脆弱になっている場合、または鍵が侵害された疑いがある場合に必要な、鍵の破棄または取り替えを...

ここでは、平文暗号化鍵と記述されていますが、センシティブ情報に全般に該当すると考えて良いでしょう。センシティブ情報にアクセスできる人が少ないほど現実的な運用が可能となり、セキュリティリスクが軽減されると言えます。
{{% /pageinfo %}}

「Microsoft.Web/sites/config」のリソース操作に、「Read, Write, delete, snapshots/read, list/Action」が有りますが、これを許可しない(NotAction)とした場合、App Settings 全体の操作に影響します。つまり、App Settingsに入れた、センシティブ情報だけを選択的に操作を禁止することはできず、全体の操作を禁止することしかできません。これだと許可の粒度が大きすぎます。App Services と App Settingsの組み合わせだけでは、環境依存設定とセンシティブ情報の分離が不十分と言えます。

※ その他の、RBACで設定可能な、App Settingsの操作は、[Microsoft.Web/sites/config/*](https://docs.microsoft.com/en-us/azure/role-based-access-control/resource-provider-operations#microsoftweb) を見てください。


## Azure App Configuration の利用

リソースとして構成情報を持つもう１つの新しい方法として、[Azure App Configuration (preview)](https://docs.microsoft.com/en-us/azure/azure-app-configuration/) があります。App Settingsでは、同一のWeb Site内の複数のインスタンスでしか設定情報は共有できません。例えば、複数のWeb Siteから構成されたサービスや、Azure Batchなど別のリソースとの間では設定の共有することができませんでした。Azure App Configuration は独立したリソースで、異なった複数のリソースから利用することができます。さらに、App Settingsと違って、App Configrationは１つのアプリケーションで複数のApp Configrationを利用することができます。その機能とRBACを使って、センシティブ情報を入れるApp Configrationを別に設けることができます。センシティブ情報を扱う場合、アクセスキーを使ったアクセス制御ではアクセスキーをどのように保護するかという問題が発生するので、MSIを使ったアクセスが必要です。

App Configuration には、設定ストアとしての豊富な機能の他、[Managed identities for Azure resources(MSI)](https://docs.microsoft.com/en-us/azure/azure-app-configuration/howto-integrate-azure-managed-service-identity)との統合、[保管中または転送中の完全なデータ暗号化](https://docs.microsoft.com/en-us/azure/azure-app-configuration/overview#why-use-app-configuration) が含まれており、総じてApp Settigsより優れています。（previewですが）

## Azure Key Vault を使う

更に進めてセキュリティ面を考慮した場合、センシティブ情報の保存は、Key Vault の利用を推薦します。下図のようにセンシティブ情報を分離して扱うことで、アプリケーションの開発運用担当と、センシティブ情報を扱うセキュリティ担当を分けることができます。これは、App Service + App Settings では出来なかったことで、センシティブ情報を知る範囲を狭めるという意味で非常に効果的です。センシティブ情報を分離してKey Vaultに入れることによって、アプリケーションの開発運用チームはセンシティブ情報を扱わなくなり、チームに要求されるセキュリティ上の負担を軽減できます。この例では、３つに分けていますが、セキュリティ要件によってさらに分割することも検討してください。

{{< figure src="../images/config03.png" title="図３ 構成情報でセンシティブ情報を分離" width="600" >}}

{{% pageinfo color="primary" %}}
**TODO:チームに要求されるセキュリティ上の負担**

非現実的な情報セキュリティ関連誓約書、セキュリティルームでのオペレーションなどをゼロにはできなくても、範囲を小さくできる、という話がある。
{{% /pageinfo %}}

アプリケーションから Key Vault へのアクセスは、設定情報に、専用のService Principalを用意して自前でアクセス経路を用意するか、**Azure リソースのマネージド ID** ([Azure リソースのマネージド ID とは?](https://docs.microsoft.com/ja-jp/azure/active-directory/managed-identities-azure-resources/overview), 以下MSI)を使います。App Service では、MSIを使うのがベストプラクティスです。だたし、現時点では、すべてのAzure リソースがMSIに対応しているわけではないので注意が必要です。[Services that support managed identities for Azure resources](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/services-support-managed-identities)
MSI 非対応リソースでは、Service Principalを使って、リソースとKey Vaultの紐付をする必要があります。（これに付いては別途）

センシティブ情報を保存する別の App Configration を用意する方法もあります。その場合、現時点の App Configration は監査ログをサポートしていないので注意してください。監査、監視には別の手段を用意する必要があります。

### 次の記事

- [Azure Key Vault の実装例とアクセス制御](/azure/security/keyvault/)

- [Azure上でセキュアなアプリケーションを作るベストプラクティス](/azure/security/)
