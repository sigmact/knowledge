---
title: "App Service でゼロからヒーロー Part 1: 設定編"
tags: 
    - zero to hero
author_name: "Jason Freeberg"
toc: true
toc_sticky: true
---

変化の早い時代では、開発者とIT意思決定者は　劇的に思い切って進化する眺望に適応する必要がある。
成功した組織ではマネージドなクラウドサービスを使い、デベロッパーの労力を増やしがちなオペレーションコストを減らし、　イノベーションをうまく加速させることによって新しいビジネス機会をつかむ。

App Service はWebアプリケーションやモバイルバックエンドホスティングするのに高生産性なPaaSとして証明されている。
App Service はAPIをデプロイ、ネットワークの拡張、ビルトインのモニタリングを提供する。

これはApp Servivce にアプリケーションを構築する連載「＃Zeroからヒーロー」の最初の記事です。
シリーズはアプリケーションの継続的なデプロイ、アプリケーションにカスタムドメインや証明書をあて、セキュアに他のクラウドサービスに接続し、
どうやって正確にスケールし、アプリケーションを構成するかについてカバーします。
このガイドを通じて App Service を立上げ、より進歩した使い方を身に着けていく素晴らしい土台を身に着けることができます。

## 前提条件

Azureのサブスクリプションを入手する必要があります。
[無料サブスクリプションはこちらから](https://azure.microsoft.com/free/search)

また、この連載では Azure CLI を使うので、[このガイド](https://docs.microsoft.com/cli/azure/install-azure-cli?view=azure-cli-latest)を見てローカルにインストールしておく必要があります。もしくは、仮想ターミナルである[Azure Cloud Shell](https://docs.microsoft.com/azure/cloud-shell/overview)を使って、Bash や PowerShell のコマンドで Azure のリソースを作成したり、更新したりする必要があります。

[GitHub のアカウント](https://github.com/join)を作る必要があります
GitHubで、↓のリポジトリを fork して自分のローカルにクローンする。リポジトリを **fork** すること。
次の記事では、どのようにGothic　Actions を使って CI/CD を構築するか説明します。

- [.NET Core](https://github.com/AzureAppService/github-action-testapp-dotnetcore)
- [Node.js](https://github.com/AzureAppService/github-action-testapp-node)
- [Spring Boot](https://github.com/AzureAppService/github-action-testapp-spring)

> もし GitHubにアカウントを持っていなければ [こちら](https://help.github.com/en/github/getting-started-with-github)を参照のこと。

## リソースの作成

これでAzureのサブスクリプションは準備できました。CLI、リポジトリ、必要なクラウドのリソースもあります。最初に[Azure Portal](https://portal.azure.com/)を開いて＊＊にある**Create a Resource** をクリックします。
メニューで **Web App**　を選んでWeb App を作るためのブレードが開きます。

![ポータルでWebアプリケーションを作る]({{site.baseurl}}/media/2020/06/zero_to_hero_portal_create.png)

以下の入力が要求される:

1. **リソースグループ** : プロジェクトのリソースをグループ化するものです。ここでは、新規作成から **zero_to_hero** と入力し、作成します。
2. **名前** : このWebアプリケーションの名前を入力します。この名前は、半角英数文字で、デフォルトのドメイン名としても使われます。ので、グローバルでユニークである必要があります。独自の名前と数字の組み合わせで作ってみましょう。例えば, **john-doe-1**。
3. **公開** : こちらはアプリケーションのソースコードをデプロイするので **コード**にしておきます。 App Service は [Docker コンテナー](https://docs.microsoft.com/azure/app-service/containers/quickstart-docker)二も対応しています。ただし、このガイドでは扱いません。
4. **ランタイム スタック** : 自分でリポジトリにクローンした内容に従い、ランタイムを選択してください。もし、「.NET Core」を選択する場合、 **.NET Core 2.1** を選びます。Node.js の場合、 **Node 12 LTS** を選びます。Spring の場合、 **Java 8 SE** を選択します。
5. **リージョン** : デプロイしたいリージョンを選択します。

入力したら,  **Review + create** をクリックし、作成を終了する。

> The Azure CLI はWebアプリケーションを作って、構成するためのコマンドを有している。 もっと知りたい人は,  [このガイド](https://docs.microsoft.com/cli/azure/webapp?view=azure-cli-latest)を見よう。

## App Service Plan とは

[App Service Plan](https://docs.microsoft.com/azure/app-service/overview-hosting-plans)
では仮想マシン(Virtual Machine)が複数の App Service をホストできる形になっている。
より高機能なハードウェア Tier が沢山のコンピューティングリソースや機能を提供する。
App Service Plan はスケールの機能も持つ。(この記事でおいおい説明する。)いつでも、ハードウェアのTierを変更することができる。

## まとめ

これでApp Service のプランと WEBアプリケーションを作成しました。
クラウド　ヒーローに向かって１ステップ近づいています。

 [次の記事では、]({{site.baseurl}}{% link _posts/2020-06-29-zero_to_hero_pt2.md %}) CI(Continuous Integration)環境を構築し、
 リリース用のパイプラインを作り、プログラムをWEBアプリケーションにデプロイします。

### 役に立つリンク

1. [App Service Plan tiers and pricing information](https://azure.microsoft.com/pricing/details/app-service/windows/)
2. [How many sites can I put in an App Service Plan?](https://azure.github.io/AppService/2019/05/21/App-Service-Plan-Density-Check.html)
3. [App Service Documentation](https://docs.microsoft.com/zure/app-service/overview-hosting-plans)
4. [App Service Team Blog](https://azure.github.io/AppService/)
