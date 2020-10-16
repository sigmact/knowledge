---
title: "App Service でゼロからヒーロー Part 1: 設定編"
weight: 10
date: 2020-09-07
description: "App Service を立上げ、より進歩した使い方を身に着けていく素晴らしい土台を身に着けることができます。"

authors: [
  ["Keiichi Hashimoto","images/author/k1hash.png"],
  ["Kazunori Hamamoto","images/author/khamamoto.jpg"],
]
type : "article"
tags: ["zero to hero", "Azure", "Web Apps"]
eyecatch: "/images/eyecatch/zero-to-hero.jpeg"
draft: false
---

## はじめに

この記事は[Azure App Service Team Blog](https://azure.github.io/AppService/)の[Zero to Heroシリーズの記事](https://azure.github.io/AppService/tags/#zero-to-hero)に感銘を受けて、和訳＆改変した記事です。本家の「Zero to Hero」というフレーズの通り、App Serviceを使ったことの無い方は一人前になれるように、すでに利用している方は知識のアップデートに役立てていただければと思います

今回は「[Zero to Hero with App Service, Part 1: Setting Up](https://azure.github.io/AppService/2020/06/29/zero_to_hero_pt1.html)」を翻訳した記事です。

なお、連載の５回目からは筆者オリジナルのコンテンツを掲載していきます。掲載予定のコンテンツは以下のようなものを予定しております

- 「Easy Authを利用した簡易的な認証ページを作成する」
- 「Application Gatewayを利用して運用を楽にする」
- 「診断ツールを使って問題を解決する」

この記事を通してWeb Appsの基礎から実運用の方法まで、筆者自身が見直す機会としてシリーズ化して掲載する事にしました。

## 概要

これはApp Servivce にアプリケーションを構築する連載「＃Zeroからヒーロー」の最初の記事です。
このシリーズはアプリケーションの継続的なデプロイ、アプリケーションにカスタムドメインや証明書をあて、セキュアに他のクラウドサービスに接続し、どうやって正確にスケールし、アプリケーションを構成するかについてカバーします。このガイドを通じて App Service を立上げ、より進歩した使い方を身に着けていく素晴らしい土台を身に着けることができます。

まずは初めの第一歩、Web Appsの作成をしてみましょう。

## 前提条件

Azureのサブスクリプションを入手する必要があります。
[無料サブスクリプションはこちらから](https://azure.microsoft.com/free/search)

また、この連載では Azure CLI を使うので、[このガイド](https://docs.microsoft.com/cli/azure/install-azure-cli?view=azure-cli-latest)を見てローカルにインストールしておく必要があります。もしくは、仮想ターミナルである[Azure Cloud Shell](https://docs.microsoft.com/azure/cloud-shell/overview)を使って、Bash や PowerShell のコマンドで Azure のリソースを作成したり、更新したりする必要があります。

次の記事では、どのようにGitHub Actions を使って CI/CD を構築するか説明します。
そのため[GitHub のアカウント](https://github.com/join)を作る必要があります。
作成する環境ごとに下記のリポジトリを **fork** して自分のローカルにクローンする必要があります。

- [.NET Core](https://github.com/AzureAppService/github-action-testapp-dotnetcore)
- [Node.js](https://github.com/AzureAppService/github-action-testapp-node)
- [Spring Boot](https://github.com/AzureAppService/github-action-testapp-spring)

> もし GitHubにアカウントを持っていなければ [こちら](https://help.github.com/en/github/getting-started-with-github)を参照のこと。

## リソースの作成

これでAzureのサブスクリプションは準備できました。CLI、リポジトリ、必要なクラウドのリソースもあります。最初に[Azure Portal](https://portal.azure.com/)を開いて**Azure サービス**にある**リソースの作成** をクリックします。
メニューで **Web アプリ**　を選んでWeb App を作るためのブレードが開きます。

![ポータルでWebアプリケーションを作る](../images/part1-1.png)

以下の入力が要求される:

1. **リソースグループ** : プロジェクトのリソースをグループ化するものです。ここでは、新規作成から **zero_to_hero** と入力し、作成します。
2. **名前** : このWebアプリケーションの名前を入力します。この名前は、半角英数文字で、デフォルトのドメイン名としても使われます。ので、グローバルでユニークである必要があります。独自の名前と数字の組み合わせで作ってみましょう。例えば, **john-doe-1**。
3. **公開** : こちらはアプリケーションのソースコードをデプロイするので **コード**にしておきます。 App Service は [Docker コンテナー](https://docs.microsoft.com/azure/app-service/containers/quickstart-docker)二も対応しています。ただし、このガイドでは扱いません。
4. **ランタイム スタック** : 自分でリポジトリにクローンした内容に従い、ランタイムを選択してください。もし、「.NET Core」を選択する場合、 **.NET Core 3.1** を選びます。Node.js の場合、 **Node 12 LTS** を選びます。Spring の場合、 **Java 8 SE** を選択します。
5. **リージョン** : デプロイしたいリージョンを選択します。

入力したら,  **確認および作成** をクリックし、作成を終了する。

> The Azure CLI はWebアプリケーションを作って、構成するためのコマンドを有している。 もっと知りたい人は,  [このガイド](https://docs.microsoft.com/cli/azure/webapp?view=azure-cli-latest)を見よう。

## App Service Plan とは

[App Service Plan](https://docs.microsoft.com/azure/app-service/overview-hosting-plans)
では仮想マシン(Virtual Machine)が複数の App Service をホストできる形になっています。
より高機能なハードウェアプランが沢山のコンピューティングリソースや機能を提供します。
App Service Plan はスケールの機能もあり。いつでも、ハードウェアのプランを変更することができます。

## まとめ

これでApp Service のプランと WEBアプリケーションを作成しました。
クラウド　ヒーローに向かって１ステップ近づいています。

 [次の記事では、](/zero-to-hero/part2-cicd/) CI (Continuous Integration) 環境を構築し、
 リリース用のパイプラインを作り、プログラムをWEBアプリケーションにデプロイします。

### 役に立つリンク

1. [App Service Plan tiers and pricing information](https://azure.microsoft.com/pricing/details/app-service/windows/)
2. [How many sites can I put in an App Service Plan?](https://azure.github.io/AppService/2019/05/21/App-Service-Plan-Density-Check.html)
3. [App Service Documentation](https://docs.microsoft.com/zure/app-service/overview-hosting-plans)
4. [App Service Team Blog](https://azure.github.io/AppService/)
