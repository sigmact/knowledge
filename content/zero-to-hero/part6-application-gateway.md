---
title: "Azure App Service と Application Gateway の連携（ルーティング編）"
weight: 1
date: 2020-11-09
description: "この記事では、Application Gatewayのルーティング機能を使用して複数の Web Apps からWebアプリケーションを構成する方法を説明します。"
authors: [
  ["Kazunori Hamamoto","images/author/khamamoto.jpg"],
]
type : "article"
category : "azure"
tags: ["zero to hero", "Azure", "Web Apps"]
eyecatch: "images/eyecatch/zero-to-hero6.jpg"
draft: false
---

## はじめに{#introduction}

この記事は[Azure App Service Team Blog](https://azure.github.io/AppService/)の[Zero to Heroシリーズの記事](https://azure.github.io/AppService/tags/#zero-to-hero)に感銘を受けて、和訳＆改変＆自分で新規執筆した記事です。
この記事を通してWeb Appsの基礎から実運用の方法まで、筆者自身が見直す機会としてシリーズ化して掲載する事にしました。
本家の「Zero to Hero」というフレーズの通り、Azure App Serviceを使ったことの無い方は一人前になれるように、すでに利用している方は知識のアップデートに役立てていただければと思います。

なお、連載の５回目からは筆者オリジナルのコンテンツを掲載しています。目次からまとめて読めますので、是非どうぞ。

[【Azure初心者から上級者まで！】Azure App Service を使いこなしてゼロからヒーローになる](https://www.sigmact.com/updated/zero-to-hero/)

## 概要{#overview}

この記事は [App Service でゼロからヒーロー](https://azure.github.io/AppService/tags/#zero-to-hero) シリーズの第6回です。
この記事を読むためには[初回記事](/zero-to-hero/part1-setting-up/)を読み終えていることを想定しています。

今回はApplication GatewayとWeb Appの連携についてご紹介したいと思います。ルーティング編ではApplication Gatewayのルーティング機能を使って複数のWeb AppからWebアプリケーションを構成する方法を説明します。

## Application Gatewayのルーティング機能とは{#routing}

Application GatewayはWEBアプリケーションのトラフィックを管理するアプリケーション レイヤー（OSI参照モデルの第７層）で動作するロードバランサーです。アプリケーションレイヤーのロードバランサなので**L7 LB**と表記されることもあります。

Application Gatewayには様々な機能がありますが、URLパスペースのルーティング機能が存在します。Application Gatewayの機能については[こちら](https://docs.microsoft.com/ja-jp/azure/application-gateway/features)を参照してください。

![Application Gateway URLルーティング](../images/part6-1.png)

この機能を利用すると、`sigmact.zero-to-hero.com/api/*`でアクセスした場合は`zero-to-hero-api.azurewebsites.net`のWeb Appへルーティングされるようになり、それ以外のアクセスは`zero-to-hero.azurewebsites.net`へルーティングされるようにする事が可能です。

### URLパスベースのルーティングの利点{#urlpath-routing}

URLパスベースのルーティングを利用するとAPIとフロントエンドをWeb App単位で管理できるため、アプリケーションをデプロイする際の影響範囲やリソース管理が容易になります。

アプリケーションに対する受信トラフィックが全てApplication Gatewayを通過するようになるため、Application Gateway配下のWeb Appを同一ドメインでアクセスできるようになります。そのため、証明書やドメイン管理が柔軟になりトラフィックの安全性も担保しやすくなります。

## Application Gatewayを作成する{#create-application-gateway}

1. Application Gatewayを作成するにはApplication Gatewayを含めるVNetが必要です。存在しない場合は[こちら](https://docs.microsoft.com/ja-jp/azure/virtual-network/quick-create-portal#create-a-virtual-network)の手順で作成してください。

2. Application Gatewayを[こちら](https://docs.microsoft.com/ja-jp/azure/application-gateway/quick-create-portal)の手順に従って作成してください。

### 「基本」タブ{#basis}

![Application Gateway基本タブ](../images/part6-2.png)

Application Gatewayを含める仮想ネットワークとサブネットは「1」の手順にて作成した仮想ネットワークを選択してください。作成した仮想ネットワークが表示されない場合はApplication Gatewayの地域と仮想ネットワークの地域が同じ地域になっているか確認してください。

### 「フロントエンドの数」タブ{#frontend}

Appliation Gatewayを外部に公開するのでパブリックIPアドレスを指定してください。

### 「バックエンド」タブ{#backend}

{{< rawhtml >}}
<figure>
  <img src="../images/part6-4.png" style="width: 40%;">
  <img src="../images/part6-5.png" style="width: 40%;">
</figure>
{{< /rawhtml >}}

規定のバックエンドプールとAPI用のバックエンドプールの合計２つのバックエンドプールを作成します。

### 「構成」タブ{#configration}

ルーティング規則を作成してフロントとバックエンドプールを紐づけます。  
ルーティング規則は以下のような項目で構成されています。

| 項目名 | 内容 |
| ---- | ---- |
| リスナー | フロントエンドのIPが主審するプロトコルとポート番号の組み合わせを管理する |
| HTTP設定 | バックエンドプールに転送する際のプロトコルやポート。パス変換やホスト名の変換に関する設定を管理する |
| バックエンドターゲット | リスナーとバックエンドプールとHTTP設定の組み合わせを管理する |

![構成タブリスナーの設定](../images/part6-6.png)

今回はHTTPの80番を対象とするようにリスナーを設定しました。

![構成タブ規定のHTTP設定](../images/part6-7.png)

API以外のリクエストは`zero-to-hero.azurewebsites.net`にHTTPSでルーティングするように`default-setting`を作成します。

![構成タブAPIのHTTP設定](../images/part6-8.png)

APIのリクエストは`zero-to-hero-api.azurewebsites.net`へHTTPSでルーティングするようにHTTP設定を作成します。

上図ではカスタムプローブが使用されていますが、初回作成時は[**いいえ**]を選択してください。カスタムプローブに関しては後述します。

[**バックエンドパスのオーバーライド**]は「**/**」を指定してください。この設定を行う事で「`http://%public_ip%/api/hoge`」のアクセスを`https://zero-to-hero-api.azurewebsites.net/api/hoge`とならないようにする事ができます。詳しくは[こちら](https://docs.microsoft.com/ja-jp/azure/application-gateway/configuration-http-settings#override-back-end-path)のドキュメントを参照してください。

![構成タブバックエンドターゲット](../images/part6-9.png)

`/api*`の場合はAPIバックエンドプール用のHTTP設定、それ以外は既定のHTTP設定となるようにバックエンドターゲットを構成します。

ここまでの設定でApplication Gatewayを通したリクエストは以下のようになります。

![Application Gatewayの構成](../images/part6-12.png)

## カスタムプローブを設定する{#custom-probe}

Application Gatewayではバックエンドプールのリソースを監視しており、異常があるバックエンドリソースはApplication Gatewayから切り離されるようになっています。規定の正常性プローブはHTTP設定で指定したプロトコルとポートを使用して正常性を確認します。規定の正常性プローブに関しては[こちら](https://docs.microsoft.com/ja-jp/azure/application-gateway/application-gateway-probe-overview#default-health-probe-settings)を確認してください。

ルートパスにアクセスできない場合は認証がかかている場合などは規定の正常性プローブでは404や403のステータスが返却されるため、正常にルーティングできないケースが存在します。そのような場合はカスタムプローブを作成して任意の条件で正常性を確認してください。

![カスタムプローブの作成](../images/part6-10.png)

Azureポータルで、[**正常性プローブ**]メニューに遷移します。  
[**追加**]をクリックして、カスタムプローブの内容を入力します。今回の例では確認するパスを`/WeatherForecast`に変更しています。  
[**テスト**]ボタンを押してプローブが正常に動作する事を確認して、カスタムプローブの設定を[**保存**]します。

### バックエンドの正常性を確認する{#backend-probe}

すべてのバックエンドの正常性は**監視**セクションの[**バックエンド正常性**]のメニューから確認する事ができます。

![カスタムプローブの作成](../images/part6-11.png)

## まとめ{#summary}

おめでとうございます。これでApplication GatewayのURLベースのルーティングを使用してAPIとアプリケーションのリクエストを適切に振り分けることができるようになりました。

アプリケーションが大規模になり複数のWeb Applicationから構成される場合でも同様にバックエンドプールへの設定を追加していく事で、柔軟に対応する事が可能です。

## 役に立つリンク{#useful-link}

- [URL パス ベースのルーティングの概要](https://docs.microsoft.com/ja-jp/azure/application-gateway/url-route-overview)
- [アプリケーション ゲートウェイ構成の概要](https://docs.microsoft.com/ja-jp/azure/application-gateway/configuration-overview)
- [Application Gateway による正常性監視の概要](https://docs.microsoft.com/ja-jp/azure/application-gateway/application-gateway-probe-overview)