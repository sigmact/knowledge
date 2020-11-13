---
title: "Azure App Service CI(継続的インテグレーション)とCD(継続的デリバリー)"
weight: 10
date: 2020-09-10
description: "前回の記事では Azure App Service プランを作り、サンプルアプリケーションをForkして、WEBアプリケーションを作りました。この記事では、GitHub Actions を使って CI/CD のパイプラインをセットアップします。"
authors: [
  ["Kazunori Hamamoto","images/author/khamamoto.jpg"]
]
type : "article"
tags: ["zero to hero", "Azure", "Web Apps"]
eyecatch: "images/eyecatch/zero-to-hero2.jpg"
draft: false
---

## はじめに

この記事は[Azure App Service Team Blog](https://azure.github.io/AppService/)の[Zero to Heroシリーズの記事](https://azure.github.io/AppService/tags/#zero-to-hero)に感銘を受けて、和訳＆改変した記事です。本家の「Zero to Hero」というフレーズの通り、Azure App Serviceを使ったことの無い方は一人前になれるように、すでに利用している方は知識のアップデートに役立てていただければと思います

今回は「[Zero to Hero with App Service, Part 2: Continuous Integration and Delivery](https://azure.github.io/AppService/2020/06/29/zero_to_hero_pt2.html)」を翻訳した記事です。


なお、連載の５回目からは筆者オリジナルのコンテンツを掲載していきます。掲載予定のコンテンツは以下のようなものを予定しております

- 「Easy Authを利用した簡易的な認証ページを作成する」
- 「Application GatewayとWeb Appの連携」
- 「診断ツールを使って問題を解決する」

この記事を通してWeb Appsの基礎から実運用の方法まで、筆者自身が見直す機会としてシリーズ化して掲載する事にしました。

## 概要

この記事は[App Service でゼロからヒーロー](/zero-to-hero/)の2回目になります。そのため[Part 1](/zero-to-hero/part1-setting-up/)を終えた想定です。

前回の記事では App Service プランを作り、サンプルアプリケーションをForkしました。この記事では、GitHub Actions を使って CI/CD のパイプラインをセットアップします。

## CI/CDとは

CI(継続的インテグレーション)とCD(継続的デリバリー) は、App Service や Azure において特別なものではありません。テストとデプロイを自動化することは、モダンなソフトウェア開発においてはベストプラクティスになります。App Service は [GitHub Actions](https://github.com/features/actions) と Azure Pipelines を直接結びつけることができるので、App Service の CI/CD は容易に設定することができます。

### 継続的インテグレーション

継続的インテグレーションは、CI/CD パイプライン の最初の一歩です。このフェーズでは、パイプラインがアプリケーションのビルドとテストを担います。
masterブランチへの新しいプルリクエストでパイプラインが走ります。
このフェーズではコーディングのスタイルガイドを強制したり、[lint](https://en.wikipedia.org/wiki/Lint_(software))を適用したりできます。

### 継続的デリバリー

アプリケーションがビルドされ、テストをパスすれば、新しいビルドは自動的にステージングかプロダクションのサーバーにデプロイされます。
より進化したデプロイチームはプロダクションに直接デプロイするかもしれませんが、思慮深いオペレーションと自動テストが要求されます。

ちょうどCI/CDを始めたチームは本番環境のミラーとなるステージング環境にデプロイし、動作確認した後に手動で新しいビルドをリリースできます。

次の記事では、本番へのトラフィックの一部をステージングにルーティングして、新しいビルドバージョンのアプリケーションにトラフィックを送る方法を紹介します。

## ステージング環境の作成

App Service では、 [スロット](https://docs.microsoft.com/azure/app-service/deploy-staging-slots)を使って、独立したステージング環境を作ったり消したりすることができます。コードやコンテナをスロットにデプロイして、新しいビルドを検証し、ステージングスロットをプロダクションスロットに **スワップ** することができます。

スワップは新しいビルドをユーザーに効果的にリリースします。
 `<name>`のパラメータをWeb Appの名前で書き換えれば、下記に記載した CLI コマンドを使ってステージングスロットが作られます。

```bash
az webapp deployment slot create --slot staging -n <name> -g zero_to_hero
```

ポータルを利用する場合は以下の画像を参考にしてください。

![デプロイスロットの作成（ポータルを利用する場合）](../images/part2-1.png)

ステージングスロットは固有のドメイン名を持ちます。ドメイン名はプロダクションスロットと似たパターンの名前を持ちます。
`http://mycoolapp.azurewebsites.net`に`staging`というスロットを追加した場合はhttp://mycoolapp **-staging** .azurewebsites.netとなります。

> [App Service のステージングスロットについて学ぶにはこちら](https://docs.microsoft.com/azure/app-service/deploy-best-practices#use-deployment-slots).

## CI/CD パイプラインを作成する

次に、CI/CDパイプラインを作り、GitHubリポジトリをステージングスロットに繋げます。
App Service には GitHub Actions と Azure Pipelinesを繋ぐ機能がビルトインされています。
サンプルアプリケーションがGitHubリポジトリにホストされているので、GitHub Actions を自分のパイプラインで利用できます。

### GitHub Actions とは

[GitHub Actions](https://github.com/features/actions) CI/CD をビルトインした自動化のフレームワークです。
リポジトリに新しいコミットや、プルリクエストへのコメント、プルリクエストがマージされたとき、CRONスケジュールがあるたびに、自動化タスクを実行することができます。自動化タスクは YAMLのファイルでリポジトリの `.github/workflows/` ディレクトリにある [ワークフローファイル](https://help.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow)にまとめられ、アプリケーションコードと共にソース配下としてトラックされます。

ワークフローファイルは自動化が実行される際の処理内容を定義します。ワークフローは１つか複数の**jobs**から構成され、ジョブは１つか複数の**steps**から構成されます。ジョブは、ステップが実行されるOSを定義します。もし、ライブラリをパブリッシュして複数のOSでテストしたいなら、複数のジョブを使う必要があります。各ステップは個々の自動化のタスクで、自分に必要なものを書いたり、GitHubコミュニティで作られたアクションをインポートすることも出来ます。

"Hello World" ワークフローファイル例は以下になります。リポジトリにPUSHされると、いつでも、_"Hello Keanu Reeves"_と現時刻がプリントされます。YAMLを注意深く読めば、ドット記法を使用して、最後のステップが以前の「Helloworld」ステップからの出力をどのように参照しているかを確認できます。

```yaml
name: Greet Everyone
on: [push]  # This workflow is triggered on pushes to the repository.

jobs:
  build:
    name: Greeting  # Job name is Greeting
    runs-on: ubuntu-latest  # This job runs on Linux
    steps:
      # This step uses GitHub's hello-world-javascript-action: https://github.com/actions/hello-world-javascript-action
      - name: Hello world
        uses: actions/hello-world-javascript-action@v1
        with:
          who-to-greet: 'Keanu Reeves'
        id: hello
      # This step prints an output (time) from the previous step's action.
      - name: Echo the greeting's time
        run: echo 'The time was ${{ steps.hello.outputs.time }}.'
```

> [GitHub Actions terms and concepts](https://help.github.com/en/actions/getting-started-with-github-actions/core-concepts-for-github-actions)について、もっと知るにはこちら

### パイプラインを作成する

[Azure Portal](https://portal.azure.com/)で、前回作ったApp Service を開きます。
**デプロイメント**ヘッダーの左側にある[**デプロイ センター**]を選択します。
App Service Deployment Centerが開きます。
Deployment Centerが CI/CD のセットアッププロセスをガイドします。

#### デプロイセンターを表示する

![デプロイセンターを表示する](../images/part2-2.png)

#### ビルドプロバイダーを選択する

次に、[**GitHub**] を選択して [**続行**]をクリックします。
次のページで、[**GitHub Actions**] を選択し、下部の[**続行**]をクリックします。

![ビルドプロバイダーを選択する](../images/part2-3.png)

#### ビルド構成を設定する

次にドロップダウンからリポジトリを選択します。言語と言語バージョンのドロップダウンを編集する必要はありません。

![ビルド構成を設定する](../images/part2-4.png)

最後のページで、リポジトリにコミットした GitHub Actions ワークフローファイルのプレビューを見つけることができます。
[**完了**]をクリックして、リポジトリにワークフローファイルをコミットします。このコミットはワークフローのトリガーになります。

> App Service と連携させる [GitHub Actions について学ぶには、こちら](https://docs.microsoft.com/azure/app-service/deploy-github-actions) and [Azure Pipelines について学ぶには、こちら](https://docs.microsoft.com/azure/app-service/deploy-continuous-deployment#github--azure-pipelines)。

### パイプラインの進捗状況をチェックする

GitHubのリポジトリにあるマスターブランチで、`.github/workflows/` という新しいファイルを見つけることができます。
GitHubリポジトリの[**Actions**]タブをクリックすると、GitHub Actions が実行された履歴を見ることができます。
ワークフローが完了すると、ステージングスロットへのデプロイが完了しているのが確認できます。

## まとめ

これで継続的ビルドとステージングにデプロイするための CI/CD パイプラインを作ることができました。次の記事では、どのようにステージングスロットとプロダクションスロットを _swap_ して、新しいビルドをプロダクションのユーザーにリリースします。
また、どのように少数のユーザーをステージングスロットにルーティングして、新しいビルドとプロダクションのトラフィックをA/Bテストするかについても説明します。

### 役に立つリンク

1. [Using GitHub Actions to deploy a Windows Container to App Service](https://azure.github.io/AppService/2020/06/09/App-Service-Continuous-Deployment-for-Windows-Containers-with-GitHub-Actions.html)
2. [GitHub Workflows to create and delete a slot for Pull Requests](https://github.com/JasonFreeberg/create-and-delete-slots)