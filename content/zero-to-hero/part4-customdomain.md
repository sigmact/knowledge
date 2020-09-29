---
title: "App Service でゼロからヒーロー Part 4: App service のWEBアプリケーションにセキュアなカスタムドメインを設定する"
weight: 1
date: 2020-09-16
description: "この記事では、Webアプリケーションにカスタムドメインを設定する方法を説明します。カスタムドメインをもっていない場合は App Service Domainsを通じて購入する方法も説明します。"
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

今回は「[Zero to Hero with App Service, Part 5: Add and Secure a Custom Domain on Your Azure App Service Web App](https://azure.github.io/AppService/2020/07/28/zero_to_hero_pt5.html)」を翻訳した記事です。

なお、連載の５回目からは筆者オリジナルのコンテンツを掲載していきます。掲載予定のコンテンツは以下のようなものを予定しております

- 「Easy Authを利用した簡易的な認証ページを作成する」
- 「Application Gatewayを利用して運用を楽にする」
- 「診断ツールを使って問題を解決する」

この記事を通してWeb Appsの基礎から実運用の方法まで、筆者自身が見直す機会としてシリーズ化して掲載する事にしました。

## 概要

この記事は [App Service でゼロからヒーロー](https://azure.github.io/AppService/tags/#zero-to-hero) シリーズの第4回です。
この記事を読むためには[初回記事](/zero-to-hero/part1-setting-up/)を読み終えていることを想定しています。

もし、“azurewebsites.net”以外のドメイン名をWebアプリケーションに当てたい場合、カスタムドメインをWebアプリケーションに足すことができます。  
それ以上に、カスタムドメインを App Service Managed Certificates の無償の証明書でセキュアにすることができます。  
サイトを閲覧しに訪れる顧客も安心することでしょう。

## 事前準備

Webアプリケーションにカスタムドメインを当てる前に、既にカスタムドメインを購入してある必要があります。  
カスタムドメインを持っていない場合は、[本記事のApp Service Domainセクションを読んで](#app-service-domain)App Service Domainsを通じて購入することができます。既にカスタムドメインを持っている場合は、[Web Appにカスタムドメインを追加する](#add-custom-domain)に進んで大丈夫です。

## App Service ドメイン{#app-service-domain}

App Service ドメインを使用すると、Azureポータルを介してAzure DNS上でホストされているドメインを作成して管理することができます。ドメインは、Web Apps、トラフィックマネージャーなどのサービスに使用することができます。また、App Serviceドメインを購入すると、プライバシー保護のメリットもあります。これは他のドメインレジストラでは追加料金がかかることが多いです。この製品は、ドメインを自動更新することができ、ウェブアプリと簡単に統合することができます。

App Service Domainを作成するには、このリンク[こちら](https://ms.portal.azure.com/#create/Microsoft.Domains)をクリックするか、Azureポータルにアクセスして"App Service ドメイン"を検索します。 

![App Service メイン](../images/part4-1.png)

ドメインの検索バーに取得したドメインを入力してください。もしリストから有効なドメインを見つけられない場合はドメインの購入はできません。しかし、利用可能なドメイン推奨リストから選択したり、新しいドメインを入力する事で購入することができます。

「連絡先情報」の項目で個人情報を入力します。次に、「プライバシー保護」の項目で追加料金なしでプライバシー保護を追加するかどうかを決めます。最後に、法的条件を確認し「OK」をクリックします。ドメインの作成に成功したら、あとは[カスタムドメインをWebアプリに追加](#add-custom-domain)です。

## Web Appにカスタムドメインを追加する{#add-custom-domain}

Web Appにカスタムドメインを設定するにはDNSレコードを更新する必要があります。もし、App Serviceドメインを購入している場合は自動で設定されるので、[検証とカスタムドメインの追加](#verify-add-domain)に進んでください。それ以外は[DNSレコードの更新](#upate-dns)に進んでください。

### DNSレコードの更新{#upate-dns}

カスタムドメインのverification IDをWebアプリケーション用に取得する必要があります。
このトークンは、ドメインの所有を確認するために使われます。
“Custom domains”タブからこの値を取得できます。

![カスタムドメインの検証ID](../images/part4-2.png)

IDを取得して、ドメインプロバイダーのサービスに行きます。ドメインプロバイダーのサービス上でDNSレコードでCNAMEとTXTレコードを追加します。
例として、wwwのサブドメインをマップします。

| Record Type  | Host       | Value                          |
|--------------|------------|--------------------------------|
| CNAME        | www        | <app-name>.azurewebsites.net   |
| TXT          | asuid.www  | カスタムドメイン検証ID  |

### 検証とカスタムドメインの追加{#verify-add-domain}

App Service ドメインを使わない場合はDNSレコードを更新した後で以下の設定を実施してください。

1. App Service に行き、“設定” セクションの下の “カスタムドメイン” に遷移します。
2. “カスタムドメインの追加” ボタンをクリックします。
3. 使いたいドメイン名を入力します。
4. “検証”ボタンをクリックします。
5. DNSレコードを正常に更新していたら、“カスタムドメインを追加”のオプションが確認できます。そうでない場合、前のセクションに戻って、正確に[DNSレコードの更新](#upate-dns)の対応ができたか確認してください。“カスタムドメインを追加”をクリックします。

![カスタムドメインの検証ID](../images/part4-3.png)

カスタムドメインにがWebアプリケーションに正常に追加されると、“割り当てられたカスタムドメイン”のリストで確認できます。これらのドメイン名を使って、作業できます。

もしカスタムドメインに証明書を当てたい場合、 次のセクション[App Service Managed Certificateの作成](#asmc)に進んでください。

## App Service Managed Certificateの作成{#asmc}

無償でカスタムドメインに証明書を当てたい場合、App Service Managed Certificate で作成して、自分のドメインにバインドできます。
Managed Certificatesがあれば、証明書が自動で更新されるされるので心配する必要はありません。

1. Webアプリケーションまで行き、“設定”の下にある“TLS/SSLの設定”を選びます。
2. “秘密Key証明書” をクリックします。
3. “App Serviceマネージド証明書の作成” をクリックします。

![App Service Managed Certificateの作成](../images/part4-4.png)

ドロップダウンメニューから証明書を作成したいドメインを選んで“作成”を押下します。

証明書が作成されると、“TLS/SSLの設定”のブレードから確認する事ができます。
自分のドメインにこの証明書を当てるために、次のセクション[Webアプリケーションに証明書をバインドする](#create-binding)で説明されるドメインに証明書をバインドする必要があります。


## Webアプリケーションに証明書をバインドする{#create-binding}

ドメインをセキュアにする最後のステップとして、ドメインに証明書をバインドします。
ポータルで、Webアプリケーションを選択し、“設定”の下にある“カスタムドメイン”を選びます。“割り当てられたカスタムドメイン”から証明書を当てたいドメインを選択し、“バインディングの追加”をクリックします。

![バインディングの追加](../images/part4-5.png)

次のブレードで 
1. 正しいカスタムドメインを選択
2. ドロップダウンから作成したばかりの App Serviceマネージド証明書を選択
3. TLS/SSLのタイプに“SNI SLL” を選択
4. “バインディングの追加”をクリック

![バインディングの追加](../images/part4-6.png)

バインディングが成功すると、グリーンのチェックマークと “安全” というワードが、“割り当てられたカスタムドメイン” リストのドメイン名の横に表示されます。

## まとめ

おめでとう。この記事で、App Serviceにセキュアなカスタムドメインを設定できるようになりました。顧客も新しいドメインにセキュアに閲覧できるようになりました。

## 役に立つリンク

- [Tutorial: Map an existing custom DNS name to Azure App Service](https://docs.microsoft.com/azure/app-service/app-service-web-tutorial-custom-domain)
- [Add a TLS/SSL certificate in Azure App Service](https://docs.microsoft.com/azure/app-service/configure-ssl-certificate#create-a-free-certificate-preview)