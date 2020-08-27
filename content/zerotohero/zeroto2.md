---
title: "App Service でゼロからヒーロー Part 2: CI(継続的インテグレーション)とCD(継続的デリバリー)"
author_name: "Jason Freeberg"
tags: 
    - zero to hero
toc: true
toc_sticky: true
---

この記事は[App Service でゼロからヒーロー]({{site.baseurl}}/tags/#zero-to-hero)の2回目になります。
ので、[Part 1]({{ site.baseurl }}{% link _posts/2020-06-29-zero_to_hero_pt1.md %})を終えた想定です。

前回の記事では App Service プランを作り、サンプルアプリケーションをForkして、WEBアプリケーションを作りました。
この記事では、GitHub Actions を使って CI/CD のパイプラインをセットアップします。

## CI/CDとは

CI(継続的インテグレーション)とCD(継続的デリバリー) は、App Service や Azure において特別なものではありません。
テストとデプロイを自動化することは、モダンなソフトウェア開発においてはベストプラクティスになります。
App Service は [GitHub Actions](https://github.com/features/actions) と Azure Pipelines を直接結びつけることができるので、
App Service の CI/CD は用意に設定することができる。

### 継続的インテグレーション

継続的インテグレーションは、CI/CD パイプライン の最初の一歩。このフェーズでは、パイプラインがアプリケーションのビルドとテストを担います。
マスターブランチへの新しいプルリクエストでパイプラインが走ります。
コーディングのスタイルガイドを強制したり、プルリクエストを[lint](https://en.wikipedia.org/wiki/Lint_(software))にほげほげ。

### 継続的デリバリー

アプリケーションがビルドされ、テストをパスすれば、新しいビルドは自動的にステージングかプロダクションのサーバーにデプロイされます。
より進化したデプロイチームはプロダクションに直接デプロイするかもしれませんが、思慮深いオペレーションと自動テストが要求されます。

ちょうどCI/CDを始めたチームは本番環境のミラーとなるステージング環境にデプロイし、動作確認した後に手動で新しいビルドをリリースできます。

次の記事では、本番へのトラフィックの一部をステージングにルーティングして、新しいビルドにトラフィックを送る方法を紹介します。

## ステージング環境の作成

App Service では、 [スロット](https://docs.microsoft.com/azure/app-service/deploy-staging-slots)を使って、独立したステージング環境を作ったり消したりすることができます。コードやコンテナをスロットにデプロイして、新しいビルドを検証し、ステージングスロットをプロダクションスロットに_swap_することができます。

スワップは新しいビルドをユーザーに効果的にリリースします。
 `<name>`のパラメータをWeb Appの名前で書き換えれば、下記に記載した CLI コマンドを使ってステージングスロットが作られます。

```bash
az webapp deployment slot create --slot staging -n <name> -g zero_to_hero
```

ステージングスロットは固有のドメイン名を持ちます。ドメイン名はプロダクションスロットと似たパターンの名前を持ちます。
 _http://mycoolapp.azurewebsites.net_ ステージングと付記されます: _http://mycoolapp<b>-staging</b>.azurewebsites.net_.

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

![GitHub Actions を設定する]({{site.baseurl}}/media/2020/06/zero_to_hero_GH_actions_setup.gif)

最後のページで、リポジトリにコミットした GitHub Actions ワークフローファイルのプレビューを見つけることができます。
**完了**をクリックして、リポジトリにワークフローファイルをコミットします。このコミットはワークフローのトリガーになります。

![Deployment Centerを使って CI/CD のパイプラインをモニターします]({{site.baseurl}}/media/2020/06/deployment_center_dashboard.png)

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