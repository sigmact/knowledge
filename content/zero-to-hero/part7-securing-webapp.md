---
title: "App Serviceの受信トラフィックと送信トラフィックを制限してアプリケーションを保護する"
weight: 1
date: 2020-11-20
description: "App Serviceの受信トラフィックと送信トラフィックを制限してアプリケーションを保護する方法を説明します"
authors: [
  ["Kazunori Hamamoto","images/author/khamamoto.jpg"],
]
type : "article"
category : "azure"
tags: ["zero to hero", "Azure", "Web Apps"]
eyecatch: "images/eyecatch/zero-to-hero7.jpg"
draft: false
---

## はじめに{#introduction}

この記事は[Azure App Service Team Blog](https://azure.github.io/AppService/)の[Zero to Heroシリーズの記事](https://azure.github.io/AppService/tags/#zero-to-hero)に感銘を受けて、和訳＆改変した記事です。
この記事を通してWeb Appsの基礎から実運用の方法まで、筆者自身が見直す機会としてシリーズ化して掲載する事にしました。
本家の「Zero to Hero」というフレーズの通り、Azure App Serviceを使ったことの無い方は一人前になれるように、すでに利用している方は知識のアップデートに役立てていただければと思います。

なお、連載の５回目からは筆者オリジナルのコンテンツを掲載しています。目次から読めますので、是非どうぞ。

[【Azure初心者から上級者まで！】Azure App Service を使いこなしてゼロからヒーローになる](https://www.sigmact.com/updated/zero-to-hero/)

## 概要{#overview}

この記事は [App Service でゼロからヒーロー](https://azure.github.io/AppService/tags/#zero-to-hero) シリーズの第７回です。
この記事を読むためには[初回記事](/zero-to-hero/part1-setting-up/)を読み終えていることを想定しています。

今回はAzure App Service Team Blogの「[Securing your web app](https://azure.github.io/AppService/2020/08/14/zero_to_hero_pt6.html)」の記事を参考にして作成しています。Web Appの受信トラフィックと送信トラフィックを制限してアプリケーションをセキュアにする方法を説明します。

## WEBアプリケーションを保護する{#securing-webapp}

アプリケーションのトラフィックにはユーザーやAPI送信を行うクライアントからのトラフィックであるインバウンドトラフィック（受信トラフィック）とWEBアプリケーションからデータベースやキャッシュや外部サービスへのアクセスを行うアウトバウンドトラフィック（送信トラフィック）があります。

WEBアプリケーションの受信と送信両方のトラフィックを制御することでアプリケーションを保護する事ができます。

![Web Appのトラフィック制御](../images/part7-1.png)

今回説明する制御方法は多くの方法のうちの一例となります。受信トラフィックはサービスエンドポイントを利用して、Application Gatewayからの受信のみ許可するように制御します。送信トラフィックはAzure Firewallを経由して送信先のFQDNやプロトコルを制御する事が可能となります。

## 受信トラフィックを保護する{#securing-inbound-traffic}

#### 1. Application GatewayとWeb Appを含めるためのVNETを作成する{#securing-inbound-traffic-1}

Application GatewayとWeb Appを含めるためのVNETを作成します。VNET作成の詳細は[こちら](https://docs.microsoft.com/azure/virtual-network/quick-create-portal)を参照してください。

![VNETのサブネット構成](../images/part7-2.png)

今回作成したサブネットは上図のようになります。後々AzureFirewallも含めるので`AzureFirewallSubnet`という名前のサブネットも作成しておきます。

#### 2. Application Gatewayを作成する{#securing-inbound-traffic-2}

[前回の記事](/part6-application-gateway/)と同様にApplication Gatewayを作成してWeb Appへのルーティングを作成します。

#### 3. App Serviceのアクセス制限を設定する{#securing-inbound-traffic-3}

App Serviceのアクセス制限を利用してApplication Gatewayから含まれるサブネットからの受信を許可します。

Azureポータルで、[**ネットワーク**]メニューに遷移します。[**アクセス制限を構成する**]をクリックしてアクセス制限の設定画面を表示します。

![アクセス制限の構成](../images/part7-3.png)

[**規則の追加**]をクリックして以下のようにApplication Gatewayのサブネットのアクセス制限を許可してください。

{{< rawhtml >}}
<figure>
  <img src="../images/part7-4.png" style="width: 60%;">
</figure>
{{< /rawhtml >}}

以上のようにして、Webアプリは、すべての受信トラフィックがアプリケーションゲートウェイを介してアプリにルーティングされます。 Application GatewayでWebアプリケーションファイアウォール（WAF）サポートを有効にすることができます。Application Gateway以外から接続するとApp Serviceのアクセス制限の機能によりHTTPステータスが403が返却されます。

## 送信トラフィックを保護する{#securing-outbound-traffic}

送信トラフィックを制御するにはApp Serviceの[リージョンVNET統合](https://docs.microsoft.com/ja-jp/azure/app-service/web-sites-integrate-with-vnet)の機能を利用する必要があります。この機能を利用する事で、すべての送信トラフィックをネットワークセキュリティグループ（NSG）とルートテーブル（UDR）の対象にすることができます。

#### 1. リージョンVNET統合を行う{#securing-outbound-traffic-1}

Azureポータルで、[**ネットワーク**]メニューに遷移します。[**構成するにはここをクリック**]をクリックしてVNET統合の設定画面を表示して、App Serviceを含めるサブネットを選択します。

![VNET統合](../images/part7-5.png)

#### 2. Azure Firewallを作成する{#securing-outbound-traffic-2}

Azure Firewallを作成して、Azure Firewallのプライベートアドレスを控えておきます。

[Azure Portal](https://portal.azure.com/)を開いて**Azure サービス**にある[**リソースの作成**] をクリックします。メニューで [**ファイアウォール**]　を選んでファイアウォールを作るためのブレードが開いて作成します。

![Azure Firewallを作成](../images/part7-6.png)

Azure Firewallは[**概要**]画面の項目で確認する事ができます。

![Azure FirewallのプライベートIPを確認](../images/part7-7.png)

#### 3. ルートテーブルを作成する{#securing-outbound-traffic-3}

App Serviceの送信トラフィックをAzure Firewallにルーティングするためのルートテーブルを作成して設定します。

[Azure Portal](https://portal.azure.com/)を開いて**Azure サービス**にある[**リソースの作成**] をクリックします。メニューで [**Route table**]　を選んでルートテーブル作成画面から作成します。

Route Tableの**設定**セクションにある[**構成**]をクリックして構成画面を開いた後に、[**追加**]をクリックして構成の追加を行います。

![Route Tableの作成](../images/part7-8.png)

- アドレス プレフィックス : `0.0.0.0/0` を入力します
- 次ホップの種類 : 仮想アプライアンスを選択します
- 次ホップアドレス：Azure FirewallのプライベートIPアドレスを入力します

{{< rawhtml >}}
<figure>
  <img src="../images/part7-9.png" style="width: 60%;">
</figure>
{{< /rawhtml >}}

Route Tableの**設定**セクションにある[**サブネット**]をクリックしてサブネット一覧を開いた後に、[**関連付け**]をクリックしてルートテーブルとサブネットの関連付けを行います。

![Route Tableの関連付け](../images/part7-10.png)

#### 4. App Serviceの送信トラフィックをすべてAzure VNET経由で送信されるように変更する{#securing-outbound-traffic-4}

規定ではRFC1918のトラフィックのみがVNET経由で送信されますが、「**WEBSITE_VNET_ROUTE_ALL**」をApp Serviceに設定するとすべての送信トラフィックをVNET経由で送信されるようになります。設定方法は[こちら](https://docs.microsoft.com/ja-jp/azure/app-service/web-sites-integrate-with-vnet#regional-vnet-integration)を参考にしてください。

#### 5. Azure Firewallで送信を許可するトラフィックを設定します{#securing-outbound-traffic-5}

ここまでの操作でApp Serviceの送信トラフィックはAzure Firewall経由で送信される状態となりますが、規定ではすべてのトラフィックが拒否されるようになっています。そのため、送信可能なトラフィックをファイアウォールの設定に追加する必要があります。

ファイアウォールの**設定**セクションにある[**ルール**]をクリックしてルール一覧を開いた後に、[**アプリケーションルールコレクション**]タブを開いて[**アプリケーションルールコレクションの追加**]をクリックして送信を許可するルールを設定します。

今回は一例として`www.sigmact.com`への送信は拒否して、それ以外のHTTP送信は許可するように設定してみました。Firewallのルールに関する詳細は[こちら](https://docs.microsoft.com/ja-jp/azure/firewall/rule-processing)を参照してください。

##### ターゲットのFQDN設定内容{#firewall-target-fqdn-settings}

| 名前 | 優先度 | アクション | ターゲットのFQDNの名前 | Source Type | Source | プロトコル:ポート | ターゲットのFQDN |
|----|----|----|----|----|----|----|----|
| AllowHttp | 1000 | 許可 | all | IP address | * | http,https | * | 
| DenyHttp | 100 | 拒否 | sigmact | IP address | * | http,https | `www.sigmact.com` | 

#### 6. 送信トラフィックの設定を確認する{#securing-outbound-traffic-6}

App Serviceのコンソールから`curl`コマンドを利用する事で簡単に確認をすることができます。App Serviceの**開発ツール**セクションにある[**コンソール**]をクリックしてコンソール画面を表示します。

`curl -Ss ifconfig.io` と入力すると送信IPアドレスが表示されます。Azure FirewallのパブリックIPアドレスと同様のアドレスになっているはずです。

`curl -Ss www.sigmact.com`と入力するとアクセスは拒否されるはずです。

![コンソールの実行結果](../images/part7-11.png)

## まとめ{#summary}

おめでとうございます。App Serviceの受信トラフィックと送信トラフィックを制御して保護する事ができるようになりました。Application GatewayのWAFを有効にしたり、Azure Firewallで詳細なルール設定も可能な構成となっています。

## 役に立つリンク{#useful-link}

- [Azure App Service のアクセス制限](https://docs.microsoft.com/ja-jp/azure/app-service/app-service-ip-restrictions)
- [アプリを Azure 仮想ネットワークと統合する](https://docs.microsoft.com/ja-jp/azure/app-service/web-sites-integrate-with-vnet)
- [Azure Firewall 規則を構成する](https://docs.microsoft.com/ja-jp/azure/firewall/rule-processing)