---
title: "情報漏えいを防ぐためにアプリケーションの設定情報はどう管理すべきか。設定ファイル暗号化にない Azure Key Vault の利点とは"
weight: 20
date: 2019-10-21
description: "この記事はトピック「Azure上でセキュアなアプリケーションを作るベストプラクティス」の中の一記事となります。本稿は、アプリケーションで使われるセンシティブ情報(パスワード等)の保護のベストプラクティスを検討するために、OWASP が提案する設定ファイル暗号化対策と、Azure が提供する Key Vault を比較して、Key Vault に保存する利点を論じています。"
authors: [
    ["Takekazu Omi","images/author/omi.png"],
    ["Keiichi Hashimoto","images/author/k1hash.png"]
]
type : "article"
category : "azure"
tags: ["Azure", "セキュリティ","KeyVault"]
eyecatch: "images/eyecatch/keyvault.png"
---

## はじめに

この記事はトピック[「Azure上でセキュアなアプリケーションを作るベストプラクティス」](/azure/security/)の中の一記事となります。

本稿は、アプリケーションで使われるセンシティブ情報(パスワード等)の保護のベストプラクティスを検討するために、OWASP が提案する設定ファイル暗号化対策と、Azure が提供する Key Vault を比較して、Key Vault に保存する利点を論じています。

Key Vaultには、鍵、証明書、シークレット、ストレージアカウントを扱う機能がありますが、ここでは話を単純化するためシークレットを前提に話をします。鍵、証明書をKey Vaultで扱うことでより高度なデータの保護が実装できますが、それは本稿の範囲外とします。実装は、.NET Framework/Core 前提ですが、他の言語でも似たような機能が用意されています。

## OWASPが提案する暗号化対策

アプリケーションにはパスワード(SQL Database等)、アクセスキー（Storge、Redis等）など様々なセンシティブ情報(Sensitive Information)があります。これらは、開発、本番など環境によって異なったものが使われ、ソースコードと別に管理される必要があります。そして、これらの情報の漏洩は、データベースなどに保存された保護対象の機密情報（個人情報やクレジットカード情報等）の漏洩に繋がる危険性があるため、厳重に管理する必要があります。

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
コントロールには人的な作業が入るため、精度は人的部分に依存してしまいます。

## Azure Key Vault の優位点

上記のOWASPやCWEで提案されている対策は、Key Vault と比較して古い方法と言わざる得ません、我々は、セキュリティを高めるために、センシティブ情報は分離し、Key Vault に入れることを推薦します。上記の推薦事項のように、Configの一部を暗号化する方法より優れていて、導入もそれほど難しくありません。

導入で少し複雑な部分は、[Azure Active Directry](https://docs.microsoft.com/en-us/azure/active-directory/fundamentals/active-directory-whatis)(以下 Azure AD)を使ったアクセス管理の部分([後述](#アクセス管理))ですが、一旦理解してしまえば、それほど高い敷居というわけではありません。Key Vault は、少しのコストで大きな効果があります。


次項では、以下の視点でなぜKey Vaultが重要か、どのような使い方がベストプラクティスなのか、実装のコストはどの程度なのか等を段階を追って説明していきます。

1. 分離：アプリケーションとセンシティブ情報は分離する
2. 暗号化：センシティブ情報は暗号化して保存する
3. アクセス管理：センシティブ情報のアクセスは制限する
4. 監査：センシティブ情報のアクセスを監査する

{{% pageinfo color="primary" %}}
App Serviceにおいて、設定情報の暗号化をするのは、幾つか障害がありますが、出来ないことではありません。どうしても必要なら、[Encrypt Configuration Sections in ASP.NET applications hosted on Cloud Services](https://code.msdn.microsoft.com/Encrypt-Configuration-5a8e8dfe)、[PKCS12ProtectedConfigurationProvider](https://github.com/kamranayub/PKCS12ProtectedConfigurationProvider/blob/master/README.md#azure)を参考にしてください。
.NET Core では、暗号化をサポートした、IConfigurationProvider が存在しないので、自前で実装する必要があります。

この方法を取る場合でも、証明書の作成、リソースへの登録は Key Vault を使うことを推薦します。そうすれば、追加のセキュリティコントロール部分の難易度が下がります。
{{% /pageinfo %}}

### 次の記事

- [Azure でセンシティブ情報を管理する際の実現方法5つを比較(ローカルファイル, App Settings, App Configuration, Key Vault, Blob)](/azure/security/keyvault-howto-manage-sensitive-information/)

- [Azure上でセキュアなアプリケーションを作るベストプラクティス](/azure/security/)
