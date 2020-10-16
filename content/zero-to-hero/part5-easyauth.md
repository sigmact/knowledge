---
title: "App Service でゼロからヒーロー Part 5: 認証/承認機能を利用した簡易的な認証ページを作成する"
weight: 1
date: 2020-10-16
description: "この記事では、Webアプリケーションに認証/承認機能を利用した認証を追加する方法を説明します。"
authors: [
  ["Kazunori Hamamoto","images/author/khamamoto.jpg"],
]
type : "article"
tags: ["zero to hero", "Azure", "Web Apps"]
eyecatch: "/images/eyecatch/zero-to-hero.jpeg"
draft: false
---

## はじめに

この記事は[Azure App Service Team Blog](https://azure.github.io/AppService/)の[Zero to Heroシリーズの記事](https://azure.github.io/AppService/tags/#zero-to-hero)に感銘を受けて、和訳＆改変した記事です。本家の「Zero to Hero」というフレーズの通り、App Serviceを使ったことの無い方は一人前になれるように、すでに利用している方は知識のアップデートに役立てていただければと思います

なお、連載の５回目からは筆者オリジナルのコンテンツを掲載していきます。掲載予定のコンテンツは以下のようなものを予定しております

- 「Easy Authを利用した簡易的な認証ページを作成する」(**当記事**)
- 「Application Gatewayを利用して運用を楽にする」
- 「診断ツールを使って問題を解決する」

この記事を通してWeb Appsの基礎から実運用の方法まで、筆者自身が見直す機会としてシリーズ化して掲載する事にしました。

## 概要

この記事は [App Service でゼロからヒーロー](https://azure.github.io/AppService/tags/#zero-to-hero) シリーズの第5回です。
この記事を読むためには[初回記事](/zero-to-hero/part1-setting-up/)を読み終えていることを想定しています。

Azure App Serviceには標準で認証と承認の機能を備えています。この機能を利用して、アプリケーションに認証機能を設定してアプリケーションを保護してみましょう。

**注意：**今回はWindowsアプリケーションの**認証/承認**機能について説明します。

## Azure App Serviceの認証と承認とは

以前は**EasyAuth**という名称でしたが、現在は**Authentication / Authorization(認証/承認)** という名称で呼ばれています。Azure App Serviceの標準機能であり、アプリケーションを修正することなく認証機能を組み込む事ができます。

この機能はIISモジュールとして動作するため、デプロイしているWebアプリケーションとは分離して実行されます。そのため、アプリケーションの修正が必要なく機能追加＆削除ができ。アプリケーションの変更にも影響を受けません。詳細な情報は[こちら](https://docs.microsoft.com/ja-jp/azure/app-service/overview-authentication-authorization#on-windows)を参照してください。

認証に利用するプロバイダーは標準で以下のようなプロバイダーがあり、任意のプロバイダーを追加する事も可能です。

- Azure Actie Directory
- Microsoftアカウント
- Facebook
- Google
- Twitter

## 認証と承認を設定する{#setup-auth}

### 認証と承認機能を有効にする{#enable-auth}

実際にAzure Active Directoryのプロバイダーを利用して**認証/承認**を設定してみましょう。

![認証/承認の設定を行う](../images/part5-1.png)

1. App Serivceのページから**設定** の項目にある [**認証/承認**] をクリックして認証/承認のブレードを表示します。
2. 「App Serivcice認証」 を[**オン**]にします。
3. 「要求が認証されない場合に実行するアクション」は[**匿名要求を許可する**]のまま変更の必要はありません。

次は「Azure Active Directry」の認証プロバイダーの構成を行います。

### Azure Active Directoryの認証プロバイダーを有効にする{#setup-provider}

![Azure Active Directoryの認証プロバイダーを有効にする](../images/part5-2.png)

1. 「管理モード」は**簡易**を選択します。
2. 管理するActive Directoryのアプリを選択します。存在しない場合は新規に作成してください。例として今回は**sigma-zero-to-hero**というアプリを作成しています。
3. 「Common Data Services に対するアクセス許可を付与する」は[**オフ**]にします
4. [**OK**]ボタンをクリックして認証プロバイダーの設定を完了します。

### 認証と承認機能の設定を完了する{#setup-complete-auth}

![認証と承認機能の設定を完了する](../images/part5-3.png)

1. Azure Active Directoryのプロバイダーが**構成済み**になっている事を確認してください。
2.  詳細設定の「トークンストア」は**オン**、 「許可される外部リダイレクト URL」は空白のまま変更の必要はありません。
3.  [**保存**]ボタンをクリックして設定を保存します。

### 認証されない場合のアクションを変更する{#change-anonymous}

この時点でWEBアプリケーションにアクセスしてみてください。設定前と特に変りは無いのではないでしょうか？現段階の設定では認証されていないユーザーは匿名アクセスを許可しているため、認証フローは表示されずにページが表示されます。

次は、匿名アクセスを許可せずにAzure Active Directoryのログインを促すように設定を変更してみましょう。

![認証されない場合のアクションを変更する](../images/part5-4.png)

1. App Serivceのページから**設定** の項目にある [**認証/承認**] をクリックして認証/承認のブレードを表示します。
2. 「要求が認証されない場合に実行するアクション」を**Azure Active Directoryでのログイン** に変更する。
3. [**保存**]ボタンをクリックして設定を保存します。

設定が完了したら再度、WEBアプリケーションにアクセスしてみましょう。下図のように認証画面が表示されるはずです。

![Azure Active Directoryの認証画面](../images/part5-5.png)

これで、Azure Active Directoryを利用して認証するWEBアプリケーションなりました。

## ログインやログアウトを行う

一般的な認証が必要なアプリケーションではログインやログアウトが必要なケースがほとんどかと思います。

ログアウトする場合は「`/.auth/logout`」へのリンクを用意する事で各プロバイダーのセッションからログアウトする事ができます。

一方ログイン画面を表示させる場合は「`/.auth/login/<provider>`」のリンクを設置します。`<provider>`の部分は各IDプロバイダーごとに決まっており、Azure Active Directoryの場合は`aad`となるためログイン用のURLは「`/.auth/login/aad`」となります。

その他プロバイダーについての機能や詳細は[こちら](https://docs.microsoft.com/ja-jp/azure/app-service/app-service-authentication-how-to)のドキュメントを参照してください。

## URL認証ルール

認証したいページの特定のURLやHTTPメソッドを制限したいケースもあるかと思います、例えば管理者用のページなどは認証をかけて閲覧制限をかけるが、それ以外のページは認証せずに閲覧したいケースなどです。

管理者用のページが「`/admin`」配下に存在する場合は以下のようなjsonファイルを用意する事で実現できます。

```json
{
  "routes": [{
      "path_prefix": "/",
      "policies": { "unauthenticated_action": "AllowAnonymous" }
    },{
      "path_prefix": "/admin",
      "policies": { "unauthenticated_action": "RedirectToLoginPage" }
    }]
}
```

上記のようなjsonファイルを`authorization.json`というファイル名で`wwwroot`の直下に保存します。ファイルの中身に関する詳細は[こちら](https://azure.github.io/AppService/2016/11/17/URL-Authorization-Rules.html)の記事を参考にしてください。

次に[認証されない場合のアクションを変更する](#change-anonymous)で行った変更を元に戻します。

{{< rawhtml >}}
<figure>
  <img src="../images/part5-6.png" style="width: 40%;">
  <img src="../images/part5-7.png" style="width: 40%;">
</figure>
{{< /rawhtml >}}

## まとめ

おめでとうございます。これでWEBアプリケーションがAzure Active Directoryへ認証を得てアクセスできるようになりました。今までは不特定多数のユーザーから閲覧可能でしたが、Azure Active Directory に登録されているユーザーのみアクセスできるようになっているため、よりセキュアなアプリケーションとなりました。

## 役に立つリンク

- [Azure App Service および Azure Functions での認証と承認](https://docs.microsoft.com/ja-jp/azure/app-service/overview-authentication-authorization)
- [Architecture of Azure App Service Authentication / Authorization](https://cgillum.tech/2016/02/01/architecture-of-azure-app-service-authentication-authorization/)