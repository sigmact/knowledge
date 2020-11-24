---
title: "Front DoorとNATゲートウェイを利用してApp Serviceを保護する"
weight: 1
date: 2020-11-24
description: "App Serviceの受信トラフィックと送信トラフィックをFront DoorとNATゲートウェイを利用してアプリケーションを保護する方法を説明します"
authors: [
  ["Kazunori Hamamoto","images/author/khamamoto.jpg"],
]
type : "article"
category : "azure"
tags: ["zero to hero", "Azure", "Web Apps"]
eyecatch: "images/eyecatch/zero-to-hero8.jpg"
draft: false
---

## はじめに{#introduction}

この記事は[Azure App Service Team Blog](https://azure.github.io/AppService/)の[Zero to Heroシリーズの記事](https://azure.github.io/AppService/tags/#zero-to-hero)に感銘を受けて、和訳＆改変＆自分で新規執筆した記事です。
この記事を通してWeb Appsの基礎から実運用の方法まで、筆者自身が見直す機会としてシリーズ化して掲載する事にしました。
本家の「Zero to Hero」というフレーズの通り、Azure App Serviceを使ったことの無い方は一人前になれるように、すでに利用している方は知識のアップデートに役立てていただければと思います。

なお、連載の５回目からは筆者オリジナルのコンテンツを掲載しています。目次からまとめて読めますので、是非どうぞ。

[【Azure初心者から上級者まで！】Azure App Service を使いこなしてゼロからヒーローになる](https://www.sigmact.com/updated/zero-to-hero/)

## 概要{#overview}

この記事は [App Service でゼロからヒーロー](https://azure.github.io/AppService/tags/#zero-to-hero) シリーズの第８回です。
この記事を読むためには[初回記事](/zero-to-hero/part1-setting-up/)を読み終えていることを想定しています。

[前回の記事](/zero-to-hero/part8-securing-webapp/)ではApplication GatewayとAzure Firewallを利用して受信トラフィックと送信トラフィックを制限してApp Serviceを保護する方法を紹介しました。今回は前回の代替手段としてAzure Front DoorとNATゲートウェイを利用してアプリケーションを保護する方法をご紹介します。

## WEBアプリケーションを保護する{#securing-webapp}

今回の構成では、受信トラフィックをAzure Front DoorとApp Serviceのアクセス機能制限を制御します。送信トラフィックはNATゲートウェイを利用して制限して構成します。

前回行った、Application GatewayとFirewallとの組み合わせの方法よりも安価で構成できますが、Applicatin Gatewayを利用した柔軟なルーティング機能や、送信する宛先をFQDNで制御する事はできなくなります。

今回の構成を図に表すと以下のような構成となります。

![Web Appのトラフィック制御](../images/part8-1.png)

## 受信トラフィックを保護する{#securing-inbound-traffic}

#### 1. Front Doorを作成する{#securing-inbound-traffic-1}

[こちらの記事](https://docs.microsoft.com/ja-jp/azure/frontdoor/quickstart-create-front-door)を参考にしてFront Doorを作成して、バックエンドにApp Serviceを指定します。今回は全てのトラフィックを`sigma-zero-to-hero.azurewebsites.net`へルーティングするように構成します。

{{< rawhtml >}}
<figure>
  <img src="../images/part8-2.png" style="width: 40%;">
  <img src="../images/part8-3.png" style="width: 40%;">
</figure>
{{< /rawhtml >}}

#### 2. App Serviceのアクセス制限を設定する{#securing-inbound-traffic-2}

App Serviceのアクセス制限を利用してFront Doorからのアクセスのみを受け付けるように設定します。

Azureポータルで、[**ネットワーク**]メニューに遷移します。[**アクセス制限を構成する**]をクリックしてアクセス制限の設定画面を表示します。

[**規則の追加**]をクリックして以下のようにService TagでFront Door Backendを指定して、Front Doorからの接続を許可するように設定します。

{{< rawhtml >}}
<figure>
  <img src="../images/part8-4.png" style="width: 60%;">
</figure>
{{< /rawhtml >}}

以上のようにして、Webアプリは、すべての受信トラフィックがFront Doorを介してアプリにルーティングされます。 Front DoorでWebアプリケーションファイアウォール（WAF）サポートを有効にすることができます。Front Door以外から接続するとApp Serviceのアクセス制限の機能によりHTTPステータスが403が返却されます。

## 送信トラフィックを保護する{#securing-outbound-traffic}

送信トラフィックを制御するにはApp Serviceの[リージョンVNET統合](https://docs.microsoft.com/ja-jp/azure/app-service/web-sites-integrate-with-vnet)の機能を利用する必要があります。この機能を利用する事で、NATゲートウェイを指定したサブネットへApp Serviceを統合することで、すべての送信アドレスがNATゲートウェイを介して送信されるようになります。

#### 1. NATゲートウェイとApp Serviceを含めるためのVNETを作成する{#securing-outbound-traffic-1}

Application GatewayとWeb Appを含めるためのVNETを作成します。VNET作成の詳細は[こちら](https://docs.microsoft.com/azure/virtual-network/quick-create-portal)を参照してください。

#### 2. NATゲートウェイを作成する{#securing-outbound-traffic-2}

[Azure Portal](https://portal.azure.com/)を開いて**Azure サービス**にある[**リソースの作成**] をクリックします。検索項目で [**NAT gateway**]　と入力してNATゲートウェイを作るためのブレードが開いて作成します。

**基本タブ**では名前や地域を設定します。

![NATゲートウェイの作成-基本タブ](../images/part8-5.png)

- NAT gateway name : 任意の名前を入力します
- 地域 : VNETと同じ地域を選択します
- Availability zone：[**None**] を選択します
- Idle timeout : [**4**] を指定します

**Outbound IPタブ**ではNATゲートウェイのIPアドレスを指定します。存在しない場合はこの時点で作成します。ここで指定したIPアドレスでApp Seriviceの送信リクエストが行われます。

![NATゲートウェイの作成-Outbound IPタブ](../images/part8-6.png)

**Subnetタブ**ではNATゲートウェイを設定するVNETのサブネットを指定します。次の手順でApp ServiceをVNET統合するのと同じサブネットを指定してください。

![NATゲートウェイの作成-Subnetタブ](../images/part8-7.png)

#### 3. リージョンVNET統合を行う{#securing-outbound-traffic-3}

Azureポータルで、[**ネットワーク**]メニューに遷移します。[**構成するにはここをクリック**]をクリックしてVNET統合の設定画面を表示して、App Serviceを含めるサブネットを選択します。

![VNET統合](../images/part8-8.png)

#### 4. App Serviceの送信トラフィックをすべてAzure VNET経由で送信されるように変更する{#securing-outbound-traffic-4}

規定ではRFC1918のトラフィックのみがVNET経由で送信されますが、「**WEBSITE_VNET_ROUTE_ALL**」をApp Serviceに設定するとすべての送信トラフィックをVNET経由で送信されるようになります。設定方法は[こちら](https://docs.microsoft.com/ja-jp/azure/app-service/web-sites-integrate-with-vnet#regional-vnet-integration)を参考にしてください。

#### 5. NATゲートウェイを設定するSubnetを指定する{#securing-outbound-traffic-5}

App ServiceVNET統合をするとVNET内に指定しているNATゲートウェイの設定が消えてしまうようなので、NATゲートウェイのサブネット設定を確認します。

NATゲートウェイのブレードで、[**Subnets**]メニューに遷移します。サブネットが指定されていない場合はVNET統合をしたApp Serviceと同じサブネットを選択して[**Save**]をクリックして設定してください。

![NATゲートウェイサブネットの確認](../images/part8-9.png)

#### 6. 送信トラフィックの設定を確認する{#securing-outbound-traffic-6}

App Serviceのコンソールから`curl`コマンドを利用する事で簡単に確認をすることができます。App Serviceの**開発ツール**セクションにある[**コンソール**]をクリックしてコンソール画面を表示します。

`curl -Ss ifconfig.io` と入力すると送信IPアドレスが表示されます。NATゲートウエイのOutbound IPで指定したパブリックIPアドレスと同様のアドレスになっているはずです。

![コンソールの実行結果](../images/part8-10.png)

## まとめ{#summary}

おめでとうございます。App Serviceの受信トラフィックと送信トラフィックを制御して保護する事ができるようになりました。Front DoorのWAFを有効にして受信トラフィックで不正なアクセスを検知する事が可能です。送信アドレスをプロトコルやポート、FQDNで制御したい場合は前回の記事と同様にAzure Firewallの利用を検討してください。

## 役に立つリンク{#useful-link}

- [Azure App Service のアクセス制限](https://docs.microsoft.com/ja-jp/azure/app-service/app-service-ip-restrictions)
- [アプリを Azure 仮想ネットワークと統合する](https://docs.microsoft.com/ja-jp/azure/app-service/web-sites-integrate-with-vnet)
- [NAT Gateway and app integration](https://azure.github.io/AppService/2020/11/15/web-app-nat-gateway.html)