---
title: "Azure Key Vault の実装例とアクセス制御"
weight: 20
date: 2019-10-26
description: "Microsoft Azureで、アプリケーションで使われるセンシティブ情報(パスワード等)の保護のベストプラクティスについて書いています。以下に、アプリケーションの設定情報を外部に保持する複数の方法について比較し、その後センシティブ情報をKey Vaultに保存する利点を論じています。"
authors: [
    ["Takekazu Omi","images/author/omi.png"],
    ["Keiichi Hashimoto","images/author/k1hash.png"]
]
type : "article"
category : "azure"
tags: ["Azure", "セキュリティ","KeyVault"]
eyecatch: "azure/security/images/accessmodel.jpg"
---

## はじめに

この記事はトピック[「Azure上でセキュアなアプリケーションを作るベストプラクティス」](/azure/security/)の中の一記事となります。

本稿は、Microsoft Azureで、アプリケーションで使われるセンシティブ情報(パスワード等)の保護のベストプラクティスとして情報をKey Vaultに保存する利点を論じています。そして、[Key Vault](https://docs.microsoft.com/en-in/azure/key-vault/key-vault-overview)の利点を構成する重要な点として、アクセス制御について記述します。


## MSIを使ったKey Vaultへのアクセス

Key Valut を導入した場合の開発コストを再確認する意味も含めて、**Azure リソースのマネージド ID (MSI)**  を使った、App SericesからのKeyVaultの利用を説明します。細部を省略して言うと、MSIは、Azureのリソースに専用のAzure ADのService Principalを作成し、他のリソースでは、そのサービスプリンシパルからのアクセスを許可することで、リソース間の信頼関係を作成する機能です。Service Principalの作成は自動的に行われ、Service PrincipalのクレデンシャルはAzure側で管理されるため非常に扱いやすい仕組みになっています。MSIを使うことで、アプリケーションからは、簡単に自身のリソースに紐付いたService Principalのトークンを取得でき、それを使って許可されたリソースを呼ぶことができます。Azure AD + MSI以前では、リソースへのアクセスは、パスワードやアカウントキーで制御されていました。ここでのポイントは、MSIでは、それらのシークレットを扱う必要が無いという点です。

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

## アプリケーションからの利用

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

## App SettingsのKey Vault参照

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

### 次の記事

- [Azure Key Vault の監査とログ](/azure/security/keyvault/)

- [Azure上でセキュアなアプリケーションを作るベストプラクティス](/azure/security/)
