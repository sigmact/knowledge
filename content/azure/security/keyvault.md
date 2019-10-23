---
title: "セキュリティを高めるためにセンシティブ情報をどう管理するか"
linkTitle: "Key Vault の利用"
weight: 20
date: 2019-08-22
description: "KeyVaultを中心に"
type : "article"
authors: [
    ["Takekazu Omi","images/author/omi.png"]
]
keywords:
  - "word1"
  - "word2"
  - "word3"
eyecatch: "images/keyvault.png"
---

## はじめに

本稿は、Microsoft Azureで、アプリケーションで使われるセンシティブ情報(パスワード等)の保護のベストプラクティスについて書いています。以下に、アプリケーションの設定情報を外部に保持する複数の方法について比較し、その後センシティブ情報をKey Vaultに保存する利点を論じています。そして、[Key Vault](https://docs.microsoft.com/en-in/azure/key-vault/key-vault-overview)の利点を構成する重要な点として、アクセス制御と、監査について記述します。

### 方式比較

設定情報を外部に保つ方法として、ローカルファイル(Web.config/appsettins.json)、App Service の[App Settings](https://docs.microsoft.com/en-us/azure/app-service/configure-common#configure-app-settings), [App Configuration](https://docs.microsoft.com/en-us/azure/azure-app-configuration/overview), [Key Vault](https://docs.microsoft.com/en-in/azure/key-vault/key-vault-overview), [Blob Storage](https://docs.microsoft.com/ja-jp/azure/storage/blobs/storage-blobs-overview)の５つを比較しました。後者４つはAzure 固有の機能ですが、同等のものは各種クラウド環境に存在します。

ここでは下記の点を比較のポイントとしました。

- 暗号化の有無：情報が暗号化して保存されるか
- アクセス制御：アプリのデプロイ等の権限と別に認証とアクセス制御に対応しているか
- 監査ログ：read/write/delete/create のログ保存
- 共有：複数のインスタンス、アプリケーションからアクセスの可否
- 変更管理：バージョン管理、もしくはスナップショットのサポート
- 変更通知：変更を通知で受け取れるか

|方式|暗号化|ACL|監査ログ|共有|変更管理|変更通知|備考|
|---|----|----|----|----|----|----|----|
|ローカルファイル|✕|✕|✕|✕|✕|✕|※1|
|App Settings|◯|✕|✕|△|✕|△|※2|
|App Configuration|◯|◯|✕|◯|◯|◯|※3|
|Key Vault|◯|◯|◯|◯|◯|✕||
|Blob Storage|◯|△|✕|◯|✕|✕|※4|

- ※1 管理はSCMで実施。App Serviceではaspnet_regiis.exeによる暗号化は利用できず。独自実装が必要
- ※2 共有は、Web Apps/Web Job/Functions等で同一WebSite内のみ。変更した場合はサイトが再起動される
- ※3 ACLはrw/roのアクセスキー、あるいはAADとRBACで制限可能
- ※4 独自実装で作れば全て可能だが、本稿ではBlobの機能のみで扱う

これを見ると、App ConfigurationとKey Vaultの間の差は、監査ログと変更通知だけで、機能面では、大きな差が無いことがわかります。

### 使い分けの基本的な考え方

まず、システムが稼働する業界や企業で定義されているコンプライアンス、ガバナンスに従で定義されている機密情報を確認します。
その中で、機密情報を扱う場合に、特別なコントロール（NDA、物理セキュリティ等）を要求されている場合は、監査ログが取れる Key Vault 一択になります。
監査ログが不要で、複数アプリ・インスタンスで共有したいなら、App Conguration、App Settingsという選択肢があります。

環境依存な設定情報には、機密と機密ではないものが両方含まれています。センシティブ情報と定義したデータへのアクセスに必要な設定情報は監査可能なKey Vaultに収容するのがベストプラクティスです。

## センシティブ情報の保護にKey Vaultを使う

アプリケーションにはパスワード(SQL Database等)、アクセスキー（Storge、Redis等）など様々なセンシティブ情報(Sensitive Information)があります。これらは、開発、本番など環境によって異なったものが使われ、ソースコードと別に管理される必要があります。そして、これらの情報の漏洩は、データベースなどに保存された保護対象の機密情報（個人情報やクレジットカード情報等）の漏洩に繋がる危険性があります。

情報漏洩は、相変わらずセキュリティインシデントの上位にあり、[OWASP Top 10-2017/A3-Sensitive Data Exposure](https://www.owasp.org/index.php/Top_10-2017_A3-Sensitive_Data_Exposure) OWASP Cheat Sheet の、.NET securityでは、漏洩の防衛方法として設定ファイルの暗号化が推薦されています。また、CWEでも同様の指摘がされています。

- [OWASP Cheat Sheet/.NET security](https://cheatsheetseries.owasp.org/cheatsheets/DotNet_Security_Cheat_Sheet.html#general)から

    > "Lock down the config file. Encrypt sensitive parts of the web.config using aspnet_regiis -pe (command line help))." 

- Common Weakness Enumeration (CWE) から
    - [CWE-13: ASP.NET Misconfiguration: Password in Configuration File](https://cwe.mitre.org/data/definitions/13.html)
    - [CWE-260: Password in Configuration File](https://cwe.mitre.org/data/definitions/260.html)
    - [CWE-312: Cleartext Storage of Sensitive Information](https://cwe.mitre.org/data/definitions/312.html)

上記、OWASPで紹介されてるのは、この[Protecting Connection Strings and Other Configuration Information (C#)](https://docs.microsoft.com/en-us/aspnet/web-forms/overview/data-access/advanced-data-access-scenarios/protecting-connection-strings-and-other-configuration-information-cs)方法です。リンク先では、RAS証明書でConfigの暗号化をしています。
この方法をステップを簡単にまとめて、課題を明らかにしていきます。

1. 証明書（秘密鍵含む）を作成する
2. 証明書（秘密鍵含む）をIISのマシンに登録する
3. 公開鍵でconfigを暗号化する
4. .NET Frameworkの場合、Web.configで暗号を解く用に暗号化プロバイダを設定

上記の手順を取る場合、秘密鍵を含んだ証明書の扱いをどうするかのが課題となります。作成した証明書の官理とIISのマシン（App Service）への登録の２つの場面が証明書の操作となり、その部分では適切なセキュリティコントロールが必要です。

このように、上記のOWASPやCWEで提案されている対策はクラウドでは古い方法と言わざる得ません、我々は、セキュリティを高めるために、センシティブ情報は分離し、Key Vault に入れることを推薦します。上記の推薦事項のように、Configの一部を暗号化する方法より優れていて、導入もそれほど難しくありません。

導入で少し複雑な部分は、[Azure Active Directry](https://docs.microsoft.com/en-us/azure/active-directory/fundamentals/active-directory-whatis)(以下 Azure AD)を使ったアクセス管理の部分([後述](#アクセス管理))ですが、一旦理解してしまえば、それほど高い敷居というわけではありません。Key Vault は、少しのコストで大きな効果があります。

本稿では、以下の視点でなぜKey Vaultが重要か、どのような使い方がベストプラクティスなのか、実装のコストはどの程度なのか等を段階を追って説明していきます。

1. 分離：アプリケーションとセンシティブ情報は分離する
2. 暗号化：センシティブ情報は暗号化して保存する
3. アクセス管理：センシティブ情報のアクセスは制限する
4. 監査：センシティブ情報のアクセスを監査する

{{% pageinfo color="primary" %}}
App Serviceにおいて、設定情報の暗号化をするのは、幾つか障害がありますが、出来ないことではありません。どうしても必要なら、[Encrypt Configuration Sections in ASP.NET applications hosted on Cloud Services](https://code.msdn.microsoft.com/Encrypt-Configuration-5a8e8dfe)、[PKCS12ProtectedConfigurationProvider](https://github.com/kamranayub/PKCS12ProtectedConfigurationProvider/blob/master/README.md#azure)を参考にしてください。
.NET Core では、暗号化をサポートした、IConfigurationProvider が存在しないので、自前で実装する必要があります。

この方法を取る場合でも、証明書の作成、リソースへの登録は Key Vault を使うことを推薦します。そうすれば、追加のセキュリティコントロール部分の難易度が下がります。
{{% /pageinfo %}}

## 設定情報の分離

ここからは、現在まで使われてきた実装を振り返りながら、分離の必要性、分ける基準、Key Vault の意味を考えていきます。Key Vaultには、鍵、証明書、シークレット、ストレージアカウントを扱う機能がありますが、ここでは話を単純化するためシークレットを前提に話をします。鍵、証明書をKey Vaultで扱うことでより高度なデータの保護が実装できますが、それは本稿の範囲外とします。実装は、.NET Framework/Core 前提ですが、他の言語でも似たような機能が用意されています。

### アプリケーションと設定ファイル(Configuration)の分離

以前より、環境依存設定はソースファイルに直接記述せずに、外部の設定ファイルに記述し実行時に読み込むのが良いとされてきました。例えば、データベースを使う場合のホスト名、データーベース名、Redis ホスト名等は、開発環境と本番環境で違います。これらの、環境依存の設定情報はハードコードせずにローカルファイルの設定ファイルに記述します。（残念ながら、未だにソースコードにハードコードされてる場合があるようですが）

アプリケーションと設定ファイルで分離されていれば、デプロイの際に設定ファルを切り替えて、開発環境では「アプリケーション＋開発用の設定ファイル」、本番環境では「アプリケーション＋本番用の設定ファイル」とすることで、必要なものがデプロイできます。分離の利点は数多くありますが、特に重要と考えるのは、「環境毎にアプリケーション本体を修正する必要が無い、ソースコード管理からセンシティブ情報情報を除外できる、アプリケーションバイナリを解析してセンシティブ情報を抜き出される危険性が無い」などの点です。この方法では、デプロイ後の設定ファイルはインスタンス内のインターネット非公開の場所に配置されることで保護されます。

ローカルファイル方式の特徴でもあり問題でもある点は、アプリケーションと設定ファイルが纏めてデプロイされることです。そのため、デプロイ（もしくは、パッケージの作成者）は、本番用の設定ファイルを参照することができ、同時にセンシティブ情報も参照することが可能となります。（これを避けるためには、設定ファイルの一部を暗号化するなどの方法が取られます、上記 OWASP Chatsheet参照）

この状態だとデプロイを自動化しても、CI/CDの設定をする時や、CI/CDでエラーになったときの調査でセンシティブ情報を見ることが出来てしまいます。CI/CDについては、参照、[Azure DevOps Projects を使用して既存のコードの CI/CD パイプラインを作成する](https://docs.microsoft.com/en-us/azure/devops-project/azure-devops-project-github)

{{< figure src="../images/config01.png" title="図１ アプリケーションと設定ファイルの関係" width="800" >}}

設定ファイルの中には、アプリケーションを構成の補助情報、環境依存情報、センシティブ情報などが一体となって書かれていて、それが運用時にアクセス可能な状態になるというわけです。ここでは、アプリのデプロイと設定のデプロイが１つになっています。

### App Service の App Settings

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


### Azure App Configuration の利用

リソースとして構成情報を持つもう１つの新しい方法として、[Azure App Configuration (preview)](https://docs.microsoft.com/en-us/azure/azure-app-configuration/) があります。App Settingsでは、同一のWeb Site内の複数のインスタンスでしか設定情報は共有できません。例えば、複数のWeb Siteから構成されたサービスや、Azure Batchなど別のリソースとの間では設定の共有することができませんでした。Azure App Configuration は独立したリソースで、異なった複数のリソースから利用することができます。さらに、App Settingsと違って、App Configrationは１つのアプリケーションで複数のApp Configrationを利用することができます。その機能とRBACを使って、センシティブ情報を入れるApp Configrationを別に設けることができます。センシティブ情報を扱う場合、アクセスキーを使ったアクセス制御ではアクセスキーをどのように保護するかという問題が発生するので、MSIを使ったアクセスが必要です。

App Configuration には、設定ストアとしての豊富な機能の他、[Managed identities for Azure resources(MSI)](https://docs.microsoft.com/en-us/azure/azure-app-configuration/howto-integrate-azure-managed-service-identity)との統合、[保管中または転送中の完全なデータ暗号化](https://docs.microsoft.com/en-us/azure/azure-app-configuration/overview#why-use-app-configuration) が含まれており、総じてApp Settigsより優れています。（previewですが）

### Azure Key Vault を使う

更に進めてセキュリティ面を考慮した場合、センシティブ情報の保存は、Key Vault の利用を推薦します。下図のようにセンシティブ情報を分離して扱うことで、アプリケーションの開発運用担当と、センシティブ情報を扱うセキュリティ担当を分けることができます。これは、App Service + App Settings では出来なかったことで、センシティブ情報を知る範囲を狭めるという意味で非常に効果的です。センシティブ情報を分離してKey Vaultに入れることによって、アプリケーションの開発運用チームはセンシティブ情報を扱わなくなり、チームに要求されるセキュリティ上の負担を軽減できます。この例では、３つに分けていますが、セキュリティ要件によってさらに分割することも検討してください。

{{< figure src="../images/config03.png" title="図３ 構成情報でセンシティブ情報を分離" width="600" >}}

{{% pageinfo color="primary" %}}
**TODO:チームに要求されるセキュリティ上の負担**

非現実的な情報セキュリティ関連誓約書、セキュリティルームでのオペレーションなどをゼロにはできなくても、範囲を小さくできる、という話がある。
{{% /pageinfo %}}

アプリケーションから Key Vault へのアクセスは、設定情報に、専用のService Principalを用意して自前でアクセス経路を用意するか、**Azure リソースのマネージド ID** ([Azure リソースのマネージド ID とは?](https://docs.microsoft.com/ja-jp/azure/active-directory/managed-identities-azure-resources/overview), 以下MSI)を使います。App Service では、MSIを使うのがベストプラクティスです。だたし、現時点では、すべてのAzure リソースがMSIに対応しているわけではないので注意が必要です。[Services that support managed identities for Azure resources](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/services-support-managed-identities)
MSI 非対応リソースでは、Service Principalを使って、リソースとKey Vaultの紐付をする必要があります。（これに付いては別途）

センシティブ情報を保存する別の App Configration を用意する方法もあります。その場合、現時点の App Configration は監査ログをサポートしていないので注意してください。監査、監視には別の手段を用意する必要があります。

### MSIを使ったKey Vaultへのアクセス

ここで、Key Valut を導入した場合の開発コストを再確認する意味も含めて、**Azure リソースのマネージド ID (MSI)**  を使った、App SericesからのKeyVaultの利用を説明します。細部を省略して言うと、MSIは、Azureのリソースに専用のAzure ADのService Principalを作成し、他のリソースでは、そのサービスプリンシパルからのアクセスを許可することで、リソース間の信頼関係を作成する機能です。Service Principalの作成は自動的に行われ、Service PrincipalのクレデンシャルはAzure側で管理されるため非常に扱いやすい仕組みになっています。MSIを使うことで、アプリケーションからは、簡単に自身のリソースに紐付いたService Principalのトークンを取得でき、それを使って許可されたリソースを呼ぶことができます。Azure AD + MSI以前では、リソースへのアクセスは、パスワードやアカウントキーで制御されていました。ここでのポイントは、MSIでは、それらのシークレットを扱う必要が無いという点です。

MSIには、システム割当のマネージドIDとユーザー割当のマネージドIDがありますが、ここではシステム割当のマネージドIDを説明します。（現状、ユーザー割当の方は、Key Vault 側がサポートしていません）

Azure Portal、Azure CLI、PowerShell、ARM template などいろいろな方法で設定できますか。再現性が高いので、ここでは、ARM template を使って手順を説明します。利用方法の詳細は、[App Service と Azure Functions でマネージド ID を使用する方法](https://docs.microsoft.com/ja-jp/azure/app-service/overview-managed-identity) を参照してください。

導入コストを評価し、非常に簡単に利用することがわかるように、実際の構築コードを交えながら説明していきます。サンプルコード一式は、[ここ](https://github.com/takekazuomi/keyvault-msi-sample) にあります。

Web Appsの作成時に、identity プロパティに、**type": "SystemAssigned"** を指定すると、このリソースにシステム割当のマネージドIDが作成されます。

```json
{
    "type": "Microsoft.Web/sites",
    "apiVersion": "2016-08-01",
    "name": "[parameters('webSiteName')]",
    "location": "[resourceGroup().location]",
    "identity": {
        "type": "SystemAssigned"
    },
    "dependsOn": [
        "[variables('hostingPlanName')]"
    ],
    "tags": {
        "usage": "kvmsi"
    },
    "properties": {
        "name": "[parameters('webSiteName')]",
        "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', variables('hostingPlanName'))]",
        "siteConfig": {
            "appSettings": [
                {
                    "name": "KeyVaultUrl",
                    "value": "[concat('https://', parameters('keyVaultName'), '.vault.azure.net/')]"
                }
            ]
        }
    }
},
```

ここでは、**appSettings** に、KeyVaultUrl という名前で、keyvaultのurlをセットしています。アプリケーションは、このApp Settingsの値とマネージドIDを使って、Key Vaultにアクセスします。マネージドIDのハンドリングは、.NET Core だと、ライブラリ（AzureServiceTokenProvider）がやってくれるので、アプリケーション側で配慮する必要があるのは、Key VaultのURLだけです。ライブラリ内の実装がどうなっているのかは、[このあたり](https://github.com/Azure/azure-sdk-for-net/blob/master/sdk/mgmtcommon/AppAuthentication/Azure.Services.AppAuthentication/TokenProviders/MsiAccessTokenProvider.cs#L66)を見ると分かります。

次に、Key Vaultのリソースを作成し、上記のシステム割当のマネージドIDへのアクセス権を与えます。**accessPolicies** のプロパティの部分がアクセス権を与えている部分です。この部分はホワイトリスト方式で、記述した操作だけが許可されます。

```
{
    "type": "Microsoft.KeyVault/vaults",
    "name": "[parameters('keyVaultName')]",
    "apiVersion": "2016-10-01",
    "location": "[resourceGroup().location]",
    "tags": {
        "usage": "kvmsi"
    },
    "properties": {
        "sku": {
            "family": "A",
            "name": "Standard"
        },
        "tenantId": "[reference(variables('identityResourceId'), '2015-08-31-PREVIEW').tenantId]",
        "accessPolicies": [
            {
                "tenantId": "[reference(variables('identityResourceId'), '2015-08-31-PREVIEW').tenantId]",
                "objectId": "[reference(variables('identityResourceId'), '2015-08-31-PREVIEW').principalId]",
                "permissions": {
                    "secrets": [
                        "get",
                        "list"
                    ]
                }
            }
        ]
    },
    "dependsOn": [
        "[concat('Microsoft.Web/sites/', parameters('webSiteName'))]"
    ]
},
```

**identityResourceId** は、variableとして下記のように宣言されています。

```json
 "identityResourceId": "[concat(resourceId('Microsoft.Web/sites', parameters('webSiteName')),'/providers/Microsoft.ManagedIdentity/Identities/default')]",
```

**accessPolicies** の、tenantId と objectId の設定は、reference を取得して属性を引いています。 この式を実行するためには、実態が作成されている必要があるので、dependsOnでwebSiteに依存させています。

**permissions": "secrets"** に、get, list を付けています。**accessPolicies** に列挙された操作だけが許されます。ここで、listを許可しているのは、今回使った .NET Coreのライブラリが列挙操作をするためです、読むだけならば、get 操作だけで良いはずなのですが、残念です。よく、listを付けずにハマります。[このあたり](https://github.com/aspnet/Extensions/blob/master/src/Configuration/Config.AzureKeyVault/src/AzureKeyVaultConfigurationProvider.cs#L77)で、リストしているのが原因です。

このテンプレートでは、追加でシークレットを作成しています。本番の展開で使えるかどうかは課題ですが、リソースの作成時にシークレットを作成しパラメータでもらった値を中に入れています。スクリプトでシークレットを生成し、さらにこの設定を使うと、シークレットの内容はアクセス権を持っているものだけが知っていて、リソース作成後書き込み権限を誰も持っていない状態にできます。これは魅力的ではありますが、シークレットのローテーションなどを考えるとあまり実用的では無いかもしれません。

```json
{
    "type": "Microsoft.KeyVault/vaults/secrets",
    "name": "[concat(parameters('keyVaultName'), '/', 'secret')]",
    "apiVersion": "2016-10-01",
    "properties": {
        "value": "[parameters('keyVaultSecret')]"
    },
    "dependsOn": [
        "[concat('Microsoft.KeyVault/vaults/', parameters('keyVaultName'))]"
    ]
}
```

### アプリケーションからの利用

一旦リソースが出来てしまえば、アプリケーションからの利用は簡単です。.NET Coreでは構成設定のライブラリ(Microsoft.Extensions.Configuration)が対応しているので、定形コードを入れるだけで設定をKey Vaultから読み込むようになります。本稿では、アプリケーションの外側に設定情報を保持し、用途によって分離する利点を付いて語っていますが、コードから見ると分散してしまっているのは面倒という側面もあります。.NET Core (Microsoft.Extensions.Configuration)では、複数のソースからの設定情報をマージして１つのConfiguration（IConfigurationRoot)に纏める機能があります。これを使うと、Jsonファイルから読んだものと、App Settingsからのもの(＝環境変数経由)をマージしたり、開発時はセンシティブ情報をUserSecretsから読み、本番ではKey Vaultから読むなどの構成を取れます。設定情報の分離により複雑さの増加を、ライブラリが吸収してくれるというわけです。

では実際のコードを見てみましょう。ConfigureAppConfigurationを呼んで、Key Vaultから設定情報を読むように WebHostBuilder に構成を追加します。CreateDefaultBuilder の中の処理で環境変数から設定情報を取り込んでいるので、WebAppsのリソースを作成する時に、App Settingsに設定した、**KeyVaultUrl** にKey VaultのURLが、builtConfigに入っています。このURL、keyVaultClient、SecretManagerを AddAzureKeyVault 拡張メソッドに渡します。やることはこれだけです。Key Vault の呼び出しはキャッシュされるという点には注意が必要です。

{{% pageinfo color="primary" %}}
**TODO:Key Vault の呼び出しはキャッシュされる**

Key Vaultは頻繁に呼び出されるように設計されていません。スロットリング値が低いので注意してください。普通のKVSとして使おうとするとスロットリングに容易に引っかかります。
{{% /pageinfo %}}

```C#
public class Program
{
    public static void Main(string[] args)
    {
        CreateWebHostBuilder(args).Build().Run();
    }

    public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
        WebHost.CreateDefaultBuilder(args)
            .ConfigureAppConfiguration((context, config) =>
            {
                if (context.HostingEnvironment.IsProduction())
                {
                    var builtConfig = config.Build();

                    var azureServiceTokenProvider = new AzureServiceTokenProvider();
                    var keyVaultClient = new KeyVaultClient(
                        new KeyVaultClient.AuthenticationCallback(
                            azureServiceTokenProvider.KeyVaultTokenCallback));

                    config.AddAzureKeyVault(builtConfig["KeyVaultUrl"],
                        keyVaultClient,
                        new DefaultKeyVaultSecretManager());
                }
            })
            .UseStartup<Startup>();
}
```

Microsoft.Extensions.Configuration 自体は、.Net Standard 2.0なので、.NET Framework でも使えるのですが、従来の [System.Configuration](https://docs.microsoft.com/en-us/dotnet/api/system.configuration?view=netframework-4.8) との共存など考えると、現状ではあまり使いやすいものではありません。.NET Frameworkでは、4.7.1 で追加された、[Microsoft.Configuration.ConfigurationBuilders](https://docs.microsoft.com/ja-jp/aspnet/config-builder) の利用をお勧めします。この２つは、名前がややっこしいので混乱しないように気を付けてください。本稿では、.NET Core 2.2 の例になっています。 ConfigurationBuildersのソースは、[ここ](https://github.com/aspnet/MicrosoftConfigurationBuilders)にあります。今は、V2を鋭意作成中のようです。

### App SettingsのKey Vault参照

別の方法として、App Settings では、Key Vault参照がサポートされています。[Use Key Vault references for App Service and Azure Functions (preview)](https://docs.microsoft.com/en-us/azure/app-service/app-service-key-vault-references)

下記のようにApp Settingsで指定すると、Key Vaultの内容が展開されて環境変数に入ります。

```
@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/mysecret/ec96f02080254f109c51a1f14cdb1931)
```

この方法の大きな利点は、ソースコードの変更が必要無いことで、欠点は、App Settingsだけでしか使えないことと、シークレットのバージョンを指定しなければいけないことです。また、これを使うとARM templateで記述する時に依存関係が複雑になるのが少々面倒ではあります。

## アクセス制御

Key Vault を安全性を高めるにはアクセスマネージメントを理解する必要があります。これが出来ていないと、大きな穴があっても気が付かないということに成りかねないので、非常に重要です。

アクセスモデルとして重要なのは下記の２点です。

- 管理プレーンとデータプレーンの２層に分かれている
- アクセスマネージメントは、Azure AD の Security Principal をベースに行われる

重要な点は上記２点しか有りません、そのうち１つは、アクセスは 2 つのプレーン、管理プレーン(management plane)とデータ プレーン(data plane)で管理されることです。そして、どちらのプレーンでも、認証にはAzure ADが使われます。

{{< figure src="../images/accessmodel.png" title="図４ Key Vaultのアクセスモデル" width="500" >}}

"管理プレーン" では コンテナーの作成と削除、アクセス ポリシーなど、Key Vault そのものを管理し、"データ プレーン" では、アクセス ポリシーに基づいて、どのプリンシパルが、キー コンテナーに格納されているデータを操作できるかを管理します。管理プレーンにアクセス権が無いと、コンテナの操作はできず、データプレーンにアクセス権が無いと（アクセス ポリシーで許可されていないと）データにはアクセスできません。データプレーンのアクセスポリシーを変更は、管理プレーンの権限で、アクセスポリシーの変更権とデータへのアクセス権とが別れているところが味噌になっています。

前記のARM template で作成した結果がどうなってるのかを Azure Portal で確認してみます。まず アクセスポリシーを見ます。

{{< figure src="../images/access01.png" title="図５ アクセスモデル" width="600" >}}

ここは、ARM template で下記の用に記述していたところです。記述通りに、作成したWeb Apps だけが一覧に出てきて、シークレットのgetとlistにチェックが入っています。

```
"accessPolicies": [
    {
        "tenantId": "[reference(variables('identityResourceId'), '2015-08-31-PREVIEW').tenantId]",
        "objectId": "[reference(variables('identityResourceId'), '2015-08-31-PREVIEW').principalId]",
        "permissions": {
            "secrets": [
                "get",
                "list"
            ]
        }
    }
]
```

Portalでシークレットの設定を見てみましょう、Portal にログインしているユーザーは、先程のaccessPoliciesのリストに載ってない別のユーザーで、アクセスは許可されていません。その場合、下記のような表示になります。

{{< figure src="../images/access02.png" title="図６ アクセスポリシー" width="600" >}}

しかし、残念ながら、このポータルにアクセスしているユーザーは、共同作成者で、Key Vaultのアクセスポリシーを操作することができるので、アクセスポリシーを変更してデータプレーンへアクセスを許可するようい変更出来てしまいます。「	
Web サイト共同作成者（Web Contributer）」などのロールでは、Key Vaultへのアクセスが許可されていないので、そのような操作をすることはできません。

共同作成者とWeb サイト共同作成者で、どのように見えるのかを比較します。共同作成者では、App Service プラン、App Servce、Log Analytics ワークスペース、キー コンテナーの４つのリソースが見えます。

{{< figure src="../images/list01.png" title="図７ 共同作成者" width="600" >}}

それに対して、Web サイト共同作成者では、App Service プラン と App Servce の２つだけです。

{{< figure src="../images/list02.png" title="図８ Web サイト共同作成者" width="600" >}}

これを見ると、Web サイト共同作成者は、完全に Key Vault が見えなくなっているのがわかります。RBACのロール周りは少々わかり辛いですが、セキュリティ面では非常に強力な武器になります。Web サイト共同作成者だけだと、Log Analyticsも見えなくってしまっているので、もう少し権限を追加する必要があります。

これらの機能を使ってセキュリティオペレーターを用意したロール分けを行います。

1. Rs:セキュリティOp（センシティブ情報にふれることが出来る）
2. Rd:開発運用者（デプロイ、ログ、メトリックス、構成情報へアクセス）
3. Ra:アプリケーション

{{< figure src="../images/roles01.png" title="図９ ロール分割例" width="600" >}}

カスタムロールを使うとロール割当を効率的に行うことができます。

## 監査

Key Vaultの２つめ特徴は、[監査ログ](https://docs.microsoft.com/ja-jp/azure/key-vault/key-vault-logging#loganalytics)と監視([Azure Monitor Alerts](https://docs.microsoft.com/en-us/azure/azure-monitor/learn/tutorial-response))です。最新のKey Vaultでは、[Log Analytics（Azure Monitor Log)](https://docs.microsoft.com/ja-jp/azure/azure-monitor/insights/azure-key-vault#enable-key-vault-diagnostics-in-the-portal)に直接、Key Vaultのアクセスログを保存可能です。保存したログをKQLでクエリーしアラートを出す機能が用意されています。
Azure PortalでのKey Vaultの監査ログの分析を支援する[Key Vault Analytics](https://azuremarketplace.microsoft.com/en-usrketplace/marketplace/apps/Microsoft.KeyVaultAnalyticsOMS?tab=Overview)ソリューションも用意されています。Key Vault Analyticsでは下記のように表示されます。

{{< figure src="../images/screen01.png" title="図10 Key Vault Analytics" width="800" >}}

監査ログをLog Analyticsに保存すると、KQLを使って、呼び出し元のIPの一覧を確認したり。

```SQL
AzureDiagnostics
| where ResourceProvider =="MICROSOFT.KEYVAULT" and Category == "AuditEvent"
| sort by TimeGenerated desc
| summarize AggregatedValue = count() by CallerIPAddress
```

{{< figure src="../images/screen02.png" title="図11 KQL CallerIPAddress" width="800" >}}

エラーになった呼び出しを確認するなど自由度の高い参照ができます。

```SQL
AzureDiagnostics
| where ResourceProvider =="MICROSOFT.KEYVAULT" and Category == "AuditEvent" 
    and httpStatusCode_d >= 300 
    and not(OperationName == "Authentication" and httpStatusCode_d == 401)
| sort by TimeGenerated desc
| summarize AggregatedValue = count() by ResultSignature
```

{{< figure src="../images/screen03.png" title="図12 KQL httpStatusCode" width="800" >}}

また、上記のクエリを少し加工（アグリゲーション部分を削除して）したクエリを使ってAlertを設定することもできます。[Respond to events with Azure Monitor Alerts](https://docs.microsoft.com/en-us/azure/azure-monitor/learn/tutorial-response)

アグリゲーション部分を削除したのは、Azure Monitor の Alert エンジンで、期間、スレッショルドの処理を行うためです。ログ検索クエリーとしては、summarize を行うと二重の集計になってしまい期待した結果になりません。

```
AzureDiagnostics
| where ResourceProvider =="MICROSOFT.KEYVAULT" and Category == "AuditEvent" 
    and httpStatusCode_d >= 300 
    and not(OperationName == "Authentication" and httpStatusCode_d == 401)
```

{{< figure src="../images/screen08.png" title="図13 Azure Monitor Alert" width="800" >}}

このような監査と監視の仕組みを使えるのことが、Key Vaultの大きな利点です。これによって高度なデータの保護を実現しています。

## 最後に

Key Vault は、
最後に、注意すべき点を１つ。Key Vaultのセキュリティが高いからと言って、すべての設定情報を Key Vaultに入れるのはアンチパターンです。セキュリティは、アクセスが限定され監査が有効なことで保たれており、全部をKey Vaultに入れてしまうと、その前提が崩れてしまいます。センシティブ情報だけをKey Vaultに入れてください。
