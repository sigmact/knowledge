---
title: "Azure App Service でゼロからヒーロー Part 3: 本番へのリリース"
weight: 10
date: 2020-09-13
description: "この記事では、ステージング環境とプロダクション環境のスロットをスワップすることによってプロダクション環境に新しいビルドをリリースする方法を学びます。また、プロダクションへのトラフィックを一部ステージングに流し、新しいビルドを全リリースする前にテストする方法を学びます。"
authors: [
  ["Kazunori Hamamoto","images/author/khamamoto.jpg"]
]
type : "article"
tags: ["zero to hero", "Azure", "Web Apps"]
eyecatch: "/images/eyecatch/zero-to-hero3.jpg"
draft: false
---

## はじめに

この記事は[Azure App Service Team Blog](https://azure.github.io/AppService/)の[Zero to Heroシリーズの記事](https://azure.github.io/AppService/tags/#zero-to-hero)に感銘を受けて、和訳＆改変した記事です。本家の「Zero to Hero」というフレーズの通り、Azure App Serviceを使ったことの無い方は一人前になれるように、すでに利用している方は知識のアップデートに役立てていただければと思います

今回は「[Zero to Hero with App Service, Part 3: Releasing to Production](https://azure.github.io/AppService/2020/07/07/zero_to_hero_pt3.html)」を翻訳した記事です。

なお、連載の５回目からは筆者オリジナルのコンテンツを掲載していきます。掲載予定のコンテンツは以下のようなものを予定しております

- 「Easy Authを利用した簡易的な認証ページを作成する」
- 「Application Gatewayを利用して運用を楽にする」
- 「診断ツールを使って問題を解決する」

この記事を通してWeb Appsの基礎から実運用の方法まで、筆者自身が見直す機会としてシリーズ化して掲載する事にしました。

## 概要

これは[App Service でゼロからヒーロー](/zero-to-hero/)を目指す連載の3番目の記事です。この記事を読むには[これまでの2つの記事](/zero-to-hero/)を終えていることを想定しています。

この時点で、メインブランチにソースコードがコミットされる度にステージングのスロットにデプロイする CI/CD のパイプラインがGitHub Actions に構築済みです。この記事では、ステージング環境とプロダクション環境のスロットをスワップすることによって
プロダクション環境に新しいビルドをリリースする方法を学びます。
また、プロダクションへのトラフィックを一部ステージングに流し、新しいビルドを全リリースする前にテストする方法を学びます。

## スロットをスワップする

Azureポータルを開きます。左側のメニューから[**デプロイ スロット**]を選択します。  
新しいブレードが開き、Webアプリケーションのスロットがリスト表示されます。  
**プロダクション** と **staging** のスロットを見つけ、上部にある[**スワップ**]ボタンをクリックします。  

![The slots overview blade](../images/part3-1.png)

[**スワップ**]ボタンを押すと、メニューがポップアップし、スワップ後に変更されるコンフィグレーションの値が表形式で表示されます。

 [Appsettings](https://docs.microsoft.com/en-us/azure/app-service/configure-common#configure-app-settings)環境変数として設定されているキーバリュー型のコンフィグレーションです。今後の記事でもう少し詳細に触れる予定です。下部の[**スワップ**]をクリックして、スワップします。

![スロットをスワップする](../images/part3-2.png)

処理が終わり、プロダクションのサイトを見るとサンプルアプリケーションが確認できます。

今回はステージングスロットにはサンプルアプリケーションをデプロイしています。スワップが判別できるようにHTMLページに判別できるようなテキストやプレースホルダを設定しておくと良いでしょう。

> また、 [カスタムコンテナーのスロットを使用する](https://docs.microsoft.com/azure/app-service/deploy-best-practices#continuously-deploy-containers)事も出来ます。

## チェックポイント

ここまでに、メインブランチにプッシュがあるたびにGitHub Actions のワークフローを起動するGitHubのリポジトリを用意しています。ワークフローはアプリケーションのビルドとステージングへのデプロイを行います。ステージングサイトを使って、最新の変更を評価することができます。

準備ができたら、スワップボタンか[CLIコマンド](https://docs.microsoft.com/en-us/cli/azure/webapp/deployment/slot?view=azure-cli-latest#az-webapp-deployment-slot-swap)を使ってスロットをスワップします。

![CI/CD プロセスを俯瞰する](../images/part3-3.png)

大きいチームで働いている場合、テスト用のスロット、品質保証、カナリアリリース、A/Bテスト等の為にスロットを作ります。
ここに複数スロットのユースケースがあります。

1. 開発者がローカルにブランチをプルして実行せず、簡単に実装の変更を確認できるように、マスターブランチからテスト用スロットへの継続的なデプロイ。
1. コンフィグレーションをよりプロダクションに似せたQAスロットにスワップする。新しいビルドはQAや受入チームによってテストされる。
1. 本番へのトラフィックの一部をステージングスロットにデプロイしたビルドで試験する。この場合、コンフィグレーションはプロダクションのスロットと合わせる必要がある。
1. 新しいビルドを丸々スワップしてプロダクションスロットにリリースする。

> デプロイとリリースの間には暗黙的な特性があります。よりこの特性について知るには、 [この記事](https://blog.turbinelabs.io/deploy-not-equal-release-part-one-4724bc1e726b)が良いでしょう。

## プロダクションでテスト

プロダクションのトラフィックを使って新しいデプロイを完全にリリースする前に一部テストするのは、プロダクションにおけるテストはよくある手法です。
これはトラフィックのシャドーイング、ミラーリング、カナリアという総称で呼ばれます。
トラフィックの [シャドーイング](https://www.getambassador.io/docs/latest/topics/using/shadowing/)
とミラーリングは興味深いトピックです。しかし、この記事ではスコープから外します。
残りのセクションでは、App Service の新しいデプロイをどのようにプロダクションにリリースする前に *カナリアリリース* するか説明します。

### コンフィグレーション

Azureポータルで、[**デプロイ スロット**]メニューに遷移します。
スロットの表の中で、**トラフィック**という項目があります。
デフォルトでは、全てのトラフィックはプロダクションスロットにルーティングされています。
トラフィックのパーセンテージを **10%** ステージングスロットに向けてみましょう。
[**保存**] をクリックします。シンプルな変更で、1/10のプロダクションへのトラフィックが、新しいビルドに流れるようになります。
「カナリアリリース」と呼ばれる手法です。

<div class="responsive-video-container">
    <iframe src="https://channel9.msdn.com/Shows/Azure-Friday/Testing-in-production-with-Azure-App-Service/player"
        allowFullScreen
        frameBorder="0"
        title="Testing in production with Azure App Service - Microsoft Channel 9 Video">
    </iframe>
</div>

> 「カナリアリリース」 という総称の起源は [the “canary in a coal mine” idiom](https://en.wiktionary.org/wiki/canary_in_a_coal_mine)になります。

### テレメトリーのタグ付け

これでプロダクションのトラフィックが一部新しいビルドに向くようになったので、
デプロイの成功、予期せぬ問題のエラーをキャッチしてコードのパスを把握したり、用心深くモニターします。

[Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)やSplunk、Dynatraceのようなモニタリングツールを使っているなら、ステージングスロットのメトリクスやログをタグ付けして、正確にデータやレポートを分割したいと思います。
クライアントサイドにあるクッキーの`x-ms-routing-name`に設定されている名称でどのスロットに繋がっているかわかります。
このクッキーを取得して、メトリックやログをタグ付けすると良いでしょう。
モニタリングのサービスダッシュボードで、フィルタしたり、データを分割して閲覧できます。

サーバーサイドのコードであれば、スロットは環境変数の`WEBSITE_HOSTNAME`からホスト名とスロット名が取得できるのでわかります。
クライアントサイドのクッキーのように、環境変数を取得してメトリクスやログをタグ付けできます。

> [x-ms-routing-name のクエリパラメータ](https://docs.microsoft.com/azure/app-service/deploy-staging-slots#route-production-traffic-manually)を使って手動でクライアントを特定のスロットにルーティングもできます。

## まとめ

「おめでとうございます」最新のデプロイをリリースする方法を学びました。
また、プロダクションへのトラフィックを一部だけ、リリースする前の新しいビルドに流す、カナリアリリースも出来るようになりました。
次の記事では、証明書、ドメイン、セキュリティ、より高度なコンフィグレーションについてカバーします。
お楽しみに！

### 役に立つリンク

- [Testing in Production, the safe way](https://medium.com/@copyconstruct/testing-in-production-the-safe-way-18ca102d0ef1)
- [Best Practices for App Service deployment slots](https://docs.microsoft.com/azure/app-service/deploy-best-practices#use-deployment-slots)