---
title: "App Service でゼロからヒーロー Part 2: CI(継続的インテグレーション)とCD(継続的デリバリー)"
weight: 10
date: 2020-09-07
description: "前回の記事では App Service プランを作り、サンプルアプリケーションをForkして、WEBアプリケーションを作りました。この記事では、GitHub Actions を使って CI/CD のパイプラインをセットアップします。"
authors: [
  ["Keiichi Hashimoto","images/author/k1hash.png"],
  ["Kazunori Hamamoto","images/author/khamamoto.jpg"],
]
tags: ["zero to hero", "Azure", "Web Apps"]
eyecatch: "/images/eyecatch/monitoring.jpg"
draft: true
---

## はじめに

この記事は[App Service でゼロからヒーロー](/zero-to-hero/)の2回目になります。そのため[Part 1](/zero-to-hero/part1-setting-up/)を終えた想定です。

前回の記事では App Service プランを作り、サンプルアプリケーションをForkしました。この記事では、GitHub Actions を使って CI/CD のパイプラインをセットアップします。

## CI/CDとは

CI(継続的インテグレーション)とCD(継続的デリバリー) は、App Service や Azure において特別なものではありません。テストとデプロイを自動化することは、モダンなソフトウェア開発においてはベストプラクティスになります。App Service は [GitHub Actions](https://github.com/features/actions) と Azure Pipelines を直接結びつけることができるので、App Service の CI/CD は用意に設定することができます。

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

## Create a CI/CD Pipeline

次に、CI/CDパイプラインを作り、GitHubリポジトリをステージングスロットに繋げます。
App Service には GitHub Actions と Azure Pipelinesを繋ぐ機能がビルトインされています。
サンプルアプリケーションがGitHubリポジトリにホストされているので、GitHub Actions を自分のパイプラインで利用できます。

### GitHub Actions とは

[GitHub Actions](https://github.com/features/actions) CI/CD をビルトインした自動化のフレームワークです。
リポジトリに新しいコミットや、プルリクエストへのコメント、プルリクエストがマージされたとき、CRONスケジュールがあるたびに、自動化タスクを実行することができます。自動化タスクは YAMLのファイルでリポジトリの `.github/workflows/` ディレクトリにある [ワークフローファイル](https://help.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow)にまとめられ、アプリケーションコードと共にソース配下としてトラックされます。

ワークフローファイルは自動化が実行された時を定義します。ワークフローは１つか複数の**jobs**から構成され、ジョブは１つか複数の**steps**から構成されます。ジョブは、ステップが実行されるOSを定義します。もし、ライブラリをパブリッシュして複数のOSでテストしたいなら、複数のジョブを使う必要があります。各ステップは個々の自動化のタスクで、自分に必要なものを書いたり、GitHubコミュニティで作られたアクションをインポートすることも出来ます。

"Hello World" ワークフローファイル例は以下になります。リポジトリにPUSHされると、いつでも、_"Hello Keanu Reeves"_と現時刻がプリントされます。YAMLを注意深く読めば、

you can see how the last step references the output from the earlier "Hello world" command using the dotted syntax.

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
**Deployment**ヘッダーの左側にある**Deployment Center**を選択します。
App Service Deployment Centerが開きます。
Deployment Centerが CI/CD のセットアッププロセスをガイドします。

次に、**GitHub** を選択して **Continue**をクリックします。
次のページで、**GitHub Actions (Preview)** を選択し、下部の**Continue**をクリックします。
そこで、ドロップダウンからリポジトリを選択します。言語と言語バージョンのドロップダウンを編集する必要はありません。

#### デプロイセンターを表示する

![GitHub Actions を設定する](../images/part2-2.png)

#### ビルドプロバイダーを選択する

![GitHub Actions を設定する](../images/part2-3.png)

#### ビルド構成を設定する

![GitHub Actions を設定する](../images/part2-4.png)

最後のページで、リポジトリにコミットした GitHub Actions ワークフローファイルのプレビューを見つけることができます。
**完了**をクリックして、リポジトリにワークフローファイルをコミットします。このコミットはワークフローのトリガーになります。

> App Service と連携させる [GitHub Actions について学ぶには、こちら](https://docs.microsoft.com/azure/app-service/deploy-github-actions) and [Azure Pipelines について学ぶには、こちら](https://docs.microsoft.com/azure/app-service/deploy-continuous-deployment#github--azure-pipelines)。

### パイプラインの進捗状況をチェックする

GitHubのリポジトリにあるマスターブランチで、`.github/workflows/` という新しいファイルを見つけることができます。
GitHubリポジトリの**Actions**タブをクリックすると、GitHub Actions が実行された履歴を見ることができます。
ワークフローが完了すると、ステージングスロットへのデプロイが完了しているのが確認できます。

## まとめ

これで継続的ビルドとステージングにデプロイするための CI/CD パイプラインを作ることができた。次の記事では、どのようにステージングスロットとプロダクションスロットを _swap_ して、新しいビルドをプロダクションのユーザーにリリースします。
また、どのように少数のユーザーをステージングスロットにルーティングして、新しいビルドとプロダクションのトラフィックをA/Bテストするかについても説明します。

### 役に立つリンク

1. [Using GitHub Actions to deploy a Windows Container to App Service]({{site.baseurl}}{% link _posts/2020-06-09-App Service Continuous Deployment for Windows Containers with GitHub Actions.md %})
2. [GitHub Workflows to create and delete a slot for Pull Requests](https://github.com/JasonFreeberg/create-and-delete-slots)