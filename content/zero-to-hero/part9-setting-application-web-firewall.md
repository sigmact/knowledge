---
title: "Azure Web Application Firewall (WAF)を設定して不正なアクセスから保護する"
weight: 1
date: 2020-12-04
description: "AzureのWAF機能を利用してアプリケーションを不正なアクセスから保護する方法を説明します。"
authors: [
  ["Kazunori Hamamoto","images/author/khamamoto.jpg"],
]
type : "article"
category : "azure"
tags: ["zero to hero", "Azure", "Web Apps"]
eyecatch: "images/eyecatch/zero-to-hero9.jpg"
draft: false
---

## はじめに{#introduction}

この記事は[Azure App Service Team Blog](https://azure.github.io/AppService/)の[Zero to Heroシリーズの記事](https://azure.github.io/AppService/tags/#zero-to-hero)に感銘を受けて、和訳＆改変＆自分で新規執筆した記事です。
この記事を通してWeb Appsの基礎から実運用の方法まで、筆者自身が見直す機会としてシリーズ化して掲載する事にしました。
本家の「Zero to Hero」というフレーズの通り、Azure App Serviceを使ったことの無い方は一人前になれるように、すでに利用している方は知識のアップデートに役立てていただければと思います。

なお、連載の５回目からは筆者オリジナルのコンテンツを掲載しています。目次からまとめて読めますので、是非どうぞ。

[【Azure初心者から上級者まで！】Azure App Service を使いこなしてゼロからヒーローになる](https://www.sigmact.com/updated/zero-to-hero/)

## 概要{#overview}

この記事は [App Service でゼロからヒーロー](https://azure.github.io/AppService/tags/#zero-to-hero) シリーズの第９回です。
この記事を読むためには[初回記事](/zero-to-hero/part1-setting-up/)を読み終えていることを想定しています。

[前回の記事](/zero-to-hero/part8-securing-webapp-2nd/)ではFront DoorとNATゲートウェイを利用して受信トラフィックと送信トラフィックを制限してApp Serviceを保護する方法を紹介しました。今回はFront DoorにWAFポリシーを適用して、不正なアクセスからアプリケーションを保護する方法をご紹介致します。

## WAFとは{#what-is-waf}

WAF(Web Application Firewall)とはWebアプリケーションへの脆弱性を利用して攻撃を防御するためのファイアウォールです。AzureではFront DoorやApplication GatewayにWAFポリシーを設定する事でファイアウォールを構成します。WAFポリシーの詳しい説明は[こちら](https://docs.microsoft.com/ja-jp/azure/web-application-firewall/overview)のドキュメントをご覧ください。

## WAFポリシーを作成する

[Azure Portal](https://portal.azure.com/)を開いて**Azure サービス**にある[**リソースの作成**] をクリックします。検索項目で [**Web Application Firewall ポリシー**]　と入力してWAFを作るためのブレードが開いて作成します。

![WAFポリシーの作成-基本タブ](../images/part9-1.png)

**基本タブ**ではWAFポリシーの種類や名前を設定します

![WAFポリシーの作成-基本タブ](../images/part9-2.png)

- 次に対するポリシー : 今回はFront Doorに対して設定するので [**グローバルWAF（フロントドア）**] を選択します
- ポリシー名 : 適当なWAFポリシーの名前を入力します
- ポリシーの状態：[**有効**] を選択します

**ポリシー設定タブ**ではWAFポリシーの動作モードや防止時のレスポンスに関する挙動を設定します

モードを[**防止**]にするとWAFポリシーに該当する場合に指定したレスポンスの動作を行う事ができます。（初期値ではHTTPステータス403）。 **検出** モードを指定するとWAFのログには 残りますが、特にレスポンスに影響はありません。

![WAFポリシーの作成-ポリシー設定タブ](../images/part9-3.png)

- モード : [**防止**] を選択します
- ブロックの応答状態コード : [**403**] を入力します

**管理されているルールタブ**ではWAFで有効にするルールを選択します。

![WAFポリシーの作成-管理されているルールタブ](../images/part9-4.png)

大きく[DefaultRuleSet](https://docs.microsoft.com/ja-jp/azure/web-application-firewall/afds/afds-overview#azure-managed-rule-sets)と [Microsoft_BotManagerRuleSet](https://docs.microsoft.com/ja-jp/azure/web-application-firewall/afds/afds-overview#bot-protection-rule-set-preview) の2種類のグループが存在します。今回はWAFを動作させるさいにXSSを利用するので[**DefaultRuleSet**]を有効にしてください。

**カスタム規則タブ**ではデフォルトで存在しないルールを作成する場合はカスタムルールの追加を行います。

指定したIPアドレスをブロックしたい場合などはカスタムルールを追加する事で対応できますが、今回の例では特に作成しません。

![WAFポリシーの作成-カスタム規則タブ](../images/part9-5.png)

**関連付けタブ**でWAFポリシーを適用するFront Doorを指定します

[**フロントエンドホストを追加する**]をクリックして、追加設定ブレードを表示した後にFront Doorとフロントエンドホストを指定して [**追加**] をクリックします。

ココで指定したフロントエンドホストに対してWAFポリシーが適用されます。

![WAFポリシーの作成-関連付けタブ](../images/part9-6.png)

## WAFポリシーの動作を確認する{#checking-waf-policy}

ここまでの設定でFront DoorにWAFポリシーが適用されているので、実際に動作させてみましょう。今回はXSSに該当するようなリクエストを発生させて検証してみたいと思います。

Front Doorに対して`?p=<script>alert('hoge');</script>`のようなクエリパラメータを付与してアクセスしてみます。現在のWAFは**防止**モードで動作させているので、設定どおり規定の403ステータスが表示されます。

![WAFの防止モード実行結果](../images/part9-7.png)

HTTPステータスも指定通り403が返却されています。

![WAFの防止モード実行結果-HTTPステータス](../images/part9-8.png)

また、WAFポリシーを[**検出**]モードで動作させた場合は以下のようにページは通常通り200レスポンスが表示されます。

![WAFの検出モード実行結果](../images/part9-9.png)

## WAFログの確認を行う{#checking-waf-log}

防止モードでも検出モードでも外とするリクエストが存在する場合はWAFログを参照する事で内容が確認できます。WAFログを確認する場合はFront Doorの診断設定にてWAFログの送信先を設定しておく必要があります。今回はLog AnalyticsへWAFログを送信して確認していきます。

### Log Analytics ワークスペースの作成を行う

WAFログを送信するためのLog Analytics ワークスペースを作成します。[こちら](https://docs.microsoft.com/ja-jp/azure/azure-monitor/learn/quick-create-workspace)のドキュメントを参考にして作成してください。

### Front Doorの診断設定を行う

Azureポータルで、Front Doorの[**診断設定**]メニューに遷移します。[**診断設定追加する**]をクリックして診断設定追加画面を表示します。

![診断設定](../images/part9-10.png)

- 診断設定の名前: 適当な名前を入力します
- log: [***FrontdoorWebApplicationfirewallLog*]にチェックを入れてください
- 宛先の詳細: [**Log Analytics への送信**]のチェックを入れて、作成したLog Analyticsワークスペースを指定してください

入力を終えたら[**保存**]をクリックして診断設定を保存します。

![診断設定の追加画面](../images/part9-11.png)

### Log Analyticsのログを確認する

設定後に再度WAFを検出または防止する動作を行います。Log Analyticsに送信されるまでにタイムラグがあるので数分後にLog Analyticsのログから該当するログがあるか確認しましょう。Log Analyticsのログを確認する方法は[こちら](https://docs.microsoft.com/ja-jp/azure/azure-monitor/log-query/log-analytics-overview)のドキュメントを参考にしてください。

`AzureDiagnostics`テーブルにWAFログが確認されており、リクエストの内容はどのルールに該当したかなど詳細が確認できるようになっています。検出モードの場合はこのログをAzure Monitor経由で通知する事で何らかのアクションを行う必要があります。実際にログを検索した画像が以下のようになります。

![WAFログの確認](../images/part9-12.png)

## まとめ{#summary}

いかがだったでしょうか、WEBアプリケーションを脆弱性を利用したリクエストから保護する方法をご紹介いたしました。Azureのサービスだけで多くの攻撃から保護する事もでき、日々多様化する攻撃方法への対応もAzureのサービス側に任せる事ができるので、まだ利用していない場合はぜひ利用してみてください。

## 役に立つリンク{#useful-link}

- [Azure Web アプリケーション ファイアウォールとは](https://docs.microsoft.com/ja-jp/azure/web-application-firewall/overview)
- [Azure Front Door 用に Web Application Firewall (WAF) を調整する](https://docs.microsoft.com/ja-jp/azure/web-application-firewall/afds/waf-front-door-tuning)