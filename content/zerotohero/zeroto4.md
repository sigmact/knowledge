---
title: 'App Service でゼロからヒーロー Part 4: Azure App Service にマイグレーションする'
author_name: "Gaurav Seth"
tags: 
    - zero to hero
toc: true
toc_sticky: true
---

App Service でゼロからヒーロー連載4回目は既にあるアプリケーションをどのように App Service にマイグレーションするか学びます。1回目から3回目まで読んでいれば、 あなたの App Service にはアプリケーションが既にデプロイされていて、この記事を読み進めることが出来ます。

{% include video id="9LBUmkUhmXU" provider="youtube" %}

## 概要

WebアプリケーションをAzure App Serviceに移行するには、幾つかの方法があります。:

- [CI/CD パイプラインを使いコードを再デプロイ](https://azure.github.io/AppService/2020/06/29/zero_to_hero_pt2.html), Webデプロイ, or the REST API を使ったデプロイ。
- Webアプリケーションをコンテナ化して [コンテナレジストリからデプロイ](https://docs.microsoft.com/azure/app-service/containers/configure-custom-container)
- App Service Migration アセスメントツールを使い ASP.NET、 PHP WebアプリケーションやLinuxコンテナをチェック。

App Service Migration アセスメントツールは、Azure App Servie にそのWebアプリケーションを移行できるかチェックします。
もし移行を検討しているWebアプリケーションが公に公開されているなら [URL をこのWebサイトに入力すれば](https://appmigration.microsoft.com/assessment/) アセスメントを実行することができます。もしくは、移行を検討しているアプリケーションがプライベートな環境にホスティングされているなら [アセスメントツールをダウンロードして実行できます。](https://appmigration.microsoft.com/readiness)

アセスメントの後、手早く簡易にIISもしくはLinux上でコンテナ化された　ASP.NET と PHP のWebアプリケーションを Azure App Service にマイグレーションできます。

## ステップバイステップ

 [Test Deployment and Migration Instructions](https://github.com/Azure/App-Service-Migration-Assistant/blob/master/MigrationDocs/Test%20Deployment%20%26%20Migration%20Instructions.docx) を参照して、サンプル　ASP.NET アプリケーションを Azure App Service に移行するステップバイステップの説明を確認してください。

こちらの [learn module](https://docs.microsoft.com/learn/modules/migrate-app-service-migration-assistant/) 

for more information on how to migrate an on-premises web application App Service.

## ツールがどのように動作するか

- オンラインのアセスメントツールは公開されたWebアプリケーションに？ [https://appmigration.microsoft.com/assessment](https://appmigration.microsoft.com/assessment)
- Tool based assessment of internal web applications using the version of tool available for Windows OS and Linux OS. (Download the tool at [https://appmigration.microsoft.com/readiness](https://appmigration.microsoft.com/readiness))
- Based on outcome of assessment (readiness checks) you may proceed further to migrate your web application to Azure App service using App Service Migration Assessment [Tool](https://appmigration.microsoft.com/readiness)

> [Assistant ツールがどのように動作するか](https://github.com/Azure/App-Service-Migration-Assistant/wiki/How-the-Assistant-Works)より詳細な情報はこちらです。

## 事前チェック

App Service　マイグレーションアシスタント・ツールは並列で事前チェックを行います。
事前チェックは、Azure App Service に移行可能なのかのチェックに使われます。
包括的にまとめたチェックリストは以下の通りです。

### IIS のWebサイトチェックS

- Port Bindings(ポートのバインディング)
- Protocol(プロトコル)
- Certificates(証明書)
- Location Tags(☆)
- ISAPI Filters(ISAPIフィルター)
- Application Pools(アプリケーションプール)
- Application Pool Identity(アプリケーションプール　アイデンティティ)
- Authentication Type(認証タイプ)
- Application Settings(アプリケーションセッティング)
- Connection Strings(接続文字列)
- Framework(フレームワーク)
- Virtual Directories(仮想ディレクトリ)

> 事前チェックと修正方法に関するより詳細な情報は [この記事で確認できます。](https://github.com/Azure/App-Service-Migration-Assistant/wiki/Readiness-Checks#iis-server-site-checks).

### Linux コンテナーのチェック

- Linux Platform (リナックスOS)
- Container Volume (コンテナーのボリューム)
- Exposed Ports (公開されているポート)
- HTTP Traffic (HTTPのトラフィック)

> こちらの [Linux Container Checks](https://github.com/Azure/App-Service-Migration-Assistant/wiki/Readiness-Checks#linux-running-container-checks)でより詳細な、事前チェックで見つかった修正方法を確認できます。

## データベースの移行とオンプレミス接続

App Service Migration Assistant は、Webアプリケーション　と　関連するコンフィグレーションをマイグレーションしますが、データベースをマイグレーションしません。そこで、Azure にデータベースをマイグレーションする幾つかの方法があります。

- [SQL Server Migration Guidance](https://azure.microsoft.com/migration/sql-server/)を使う
- [Azure Database Migration Service](https://docs.microsoft.com/azure/dms/dms-overview)を使う

Azure App service にあるWebアプリケーションは、既に存在するオンプレミスのデータベースにも、[Hybrid Connections](https://docs.microsoft.com/azure/app-service/app-service-hybrid-connections)を使って接続できます。

Hybrid Connections は、他のネットワークにある、例えばオンプレミスのデータベースに安全にアクセスすることを可能にします。
マイグレーションツールはハイブリッドコネクションをセットアップし、データベースがオンプレミスにある間の接続を可能にします。
このようにデータベースは後で移行することもできます。

Azure Migrate Hub Integration

[Azure Migrate](https://azure.microsoft.com/services/azure-migrate/) はオンプレミスのサーバーを始めとするインフラ、アプリケーション、データを評価及び移行するための集約されたハブです。
このツールは、成功した移行とブロックされた移行を連携するハブ？
The Migration assessment tool allows you to sync assessment data with Azure Migrate Hub for both successful migrations and migrations with blockers.

![Azure Migration Hub]({{site.baseurl}}/media/2020/07/migration_hub.png){: .align-center}

## まとめ

これらのリソースを使えば、.NET、 PHP、 Linuxコンテナーに関する行のフィジビリティ(実現可能性)を容易に確認できます。
移行アセスメントが終わったら、アシスタントを使いステップバイステップで App Service への移行を進めることができます。

その他の情報は以下の通りです。

### 役に立つリンク

1. App Service Migration Assistant Tool [Website](https://appmigration.microsoft.com/)
1. Migration [checklist](https://azure.microsoft.com/en-us/blog/migration-checklist-when-moving-to-azure-app-service/) when moving to Azure App Service
1. Linux [Notes](https://github.com/Azure/App-Service-Migration-Assistant/wiki/Linux-Notes)
1. Release [Notes](https://github.com/Azure/App-Service-Migration-Assistant/wiki/Release-Notes)
1. Known [Issues](https://github.com/Azure/App-Service-Migration-Assistant/wiki/Known-Issues)
1. Azure [CLI](https://github.com/Azure/App-Service-Migration-Assistant/wiki/Using-Azure-CLI)