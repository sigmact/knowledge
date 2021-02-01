---
title: "Webアプリの立上げと相性の良い Azure ADB2C　第2回(ユーザーフローとは)"
authors:
  [
    ["Tsubasa Yoshino", "images/author/yoshinotsubasa.jpg"],
  ]
weight: 10
date: 2021-01-26
description: ""
type: "article"
category : "azure"
tags: ["Azure", "AADB2C", "Web Apps", "Azure AD B2C"]
eyecatch: "images/eyecatch/deploy.png"
draft: false
---

## はじめに

[最初の記事](../azureadb2c/) では、AAD B2C の概要について触れました。
これ以降で、具体的に AAD B2C を使用して認証システムを構築する方法を説明していきます。
## ユーザーフローについて

### ユーザーフローの概要

AAD B2C で認証システムを構築する場合は、主に二種類の方法が用意されています。


1. ユーザーフロー
2. カスタムポリシー

ユーザーフローで出来ることは、

* 画面のカスタマイズ (HTML、CSS、js)
* ユーザから収集したい情報の追加・削除 (フォームの入力項目)
* 一部フロー内での外部 API 呼出し (プレビュー)

これから説明する部分は、ユーザーフローに該当する部分になります。(カスタムポリシーは、次の記事で触れていこうと思います。)

### JavaScript を使用する際のガイドライン

UI のカスタマイズをするうえで、JavaScript を使用すると思いますが、公式ドキュメントには、下記のようなガイドラインが用意されているので
その点に留意して実装を進めてください。

* a タグにクリックイベントをバインドしない
* AAD B2C が生成するコードやコメントに依存する実装をしない
* AAD B2C が精製する HTML 要素の順序や階層を変更しない。変更する場合は、AAD B2C のポリシーを使用する
* HTTP 呼出しをするために API 側に CORS 設定をする必要がある可能性有り
* 呼び出す RESTful サービスは、HTTPS のみ許可する
* JS を使用して直接 AAD B2C のエンドポイントを呼び出さない
* 外部の JS ファイルを使用する場合は、絶対 URL で指定する
* AAD B2C が jQuery を埋め込むので、異なるバージョンの jQuery を埋め込まない
* RequireJS は、サポートされない
* ほとんどの JS フレームワークは、サポートされない
* window.SETTINGS、window.CONTENT オブジェクトによって、現在の UI 言語などの情報を取得可能。これらの設定は、変更しない
* AAD B2C が出力するエラーメッセージは、ポリシーでローカライズする
* ポリシーで可能な操作は、ポリシーを使用することが推奨
## ユーザーフローでサインイン、サインアップページを構築する

ここから早速、基本的な構築方法の説明に進んでいこうと思います。

今回は、サンプルとして ASP.NET Core のプロジェクトに組み込んでいきます。

### B2C のテナントを作成する

AAD B2C は、本質としては、AAD なので、B2C 用の AAD テナントを始めに作成します。

B2C で検索をすると、Azure Active Directory B2C のリソースが出てくるので、それを選択します。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/tenant/01.png" style="width:70%">
</figure>
{{< /rawhtml >}}

作成に進むと、新しい B2C テナントを作成するか、既存のテナントをサブスクリプションに紐づけるか選択する画面が出ますので、
今回は、新しくテナントを作成します。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/tenant/02.png" style="width:70%">
</figure>
{{< /rawhtml >}}

テナント作成画面では、組織名、ドメイン名、使用する国/地域を設定します。
ドメイン名は、「ドメイン名.onmicrosoft.com」という AAD のドメイン名に使用される名前になります。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/tenant/03.png" style="width:70%">
</figure>
{{< /rawhtml >}}

AAD B2C の地域は、選択した地域に最適なデータセンターにデプロイされるという意味になるので、データセンターを指定するよくあるものではないことにご留意ください。

作成が完了すると、新しい AAD のディレクトリが作成されるので新しく作成されたディレクトリへ移動します。

### アプリの登録

AAD テナントが作成されたら、次にテナントに、B2C を使用するアプリを紐づけます。

新しく出来たディレクトリに移動し、AAD B2C のリソースを選択すると以下のような画面が表示されます。
今後は、ここで B2C についての設定を行っていきます。

また、下図の画面で表示されている「ドメイン名」は、後程使用するのでどこかにメモしておいてください。

{{<figure src="../images/part2/b2c/01.png">}}

まず初めにアプリの登録を行います。
この設定は、サインイン、サインアップなどが完了した後のレスポンスの返却先を予め登録しておく設定です。

アプリの登録 > 新規登録 を選択します。

{{<figure src="../images/part2/b2c/02.png">}}

下図の赤枠の項目を設定してきます。

「サポートされているアカウントの種類」は、「任意の ID プロバイダーまたは組織ディレクトリ内のアカウント」を選択します。
他の二つは、一般のユーザに公開しない組織に閉じたアプリケーションとして構築する場合に設定を検討する項目です。

「リダイレクト URI」は、B2C を使用するアプリの種類とそのレスポンスの受け口を設定します。
例えば ASP.NET Core と提供されるライブラリを使用した場合、標準では、「https://任意の URL /signin-oidc」のように設定します。

「アクセス許可」は、認証に使う OpenId Connect のスコープ設定になります。
AAD B2C を使用する場合、「openid」と「offline_access」のスコープを許可する必要があるため、ここにチェックを入れます。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/03.png" style="width:90%">
</figure>
{{< /rawhtml >}}

#### スコープの補足

先ほど許可した OIDC のスコープ、「openid」と「offline_access」は、それぞれ以下のようなアクセス許可を付与することになります。

##### openid

「openid」スコープを許可した場合、トークンエンドポイントから、アクセストークンに加えて Id トークンも発行されるようになります。
この Id トークンは、ユーザ毎に発行される一意識別子であり、このトークンを使用してユーザ情報へのアクセスをアプリに提供できるようになります。

##### offline_access

「offline_access」は、アプリのユーザが不在(オフライン)の状態でもアプリが自動でトークンを更新することが出来るようになります。
このスコープを許可しない場合、通常では、アクセストークンが失効した場合に再度ユーザからの認可が必要になりますが、
このスコープを許可することによってアプリは、ユーザが不在の状態でもトークンを更新して、ユーザ情報にアクセスし続けることができるようになります。

#### 暗黙的フローの許可

アプリの登録が終わったら、最後に認証関連のアクセス許可を追加します。

またアプリ管理画面に表示されている「アプリケーション(クライアント)ID」は、後程使用するのでどこかにメモしておいてください。

アプリ管理画面の認証の項目に移動します。

{{<figure src="../images/part2/b2c/04.png">}}

ここでは、発行されるトークンの設定を行います。

今回は、最後に ASP.NET Core に組み込む際に、アクセストークンが必要になるので、「アクセストークン」と「ID トークン」の両方にチェックを入れます。

{{<figure src="../images/part2/b2c/05.png">}}
### ユーザ属性を定義する

ユーザ属性は、サインアップ時に収集するユーザ名等の情報です。
ここで定義をしたうえで、フローでどのユーザ属性を使用するか指定すると、ユーザ情報の収集が出来るようになります。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/06.png" style="width:70%">
</figure>
{{< /rawhtml >}}

標準でもユーザ名、メールアドレス等の基本的な情報は、定義されています。

画面上部の「追加」から設定します。
使用できるデータ型は、

* 文字列
* Boolean
* int

の3種類です。

また、名前に日本語名を入れると警告が出るので、英数字で入力します。

{{<figure src="../images/part2/b2c/07.png">}}

### ユーザフローを作成する

アプリの登録が完了したら、ユーザフローを作成します。

メニューの ユーザーフロー > 新しいユーザーフロー に進みます。

{{<figure src="../images/part2/b2c/08.png">}}

今回は、サインインサインアップを使用します。
バージョンは、「推奨」となってるものを使用します。

{{<figure src="../images/part2/b2c/09.png">}}

ID プロバイダーは、標準で表示される「Email signup」を使用します。
別途、ID プロバイダーを追加した場合は、MS アカウントなどの ID プロバイダーが表示されるようになります。

多要素認証は、現状メール or SMS がサポートされています。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/10.png" style="width:70%">
</figure>
{{< /rawhtml >}}

ユーザ属性は、サインアップ時に収集したい場合は、「属性を収集する」にチェックを入れます。
またサインイン時に、アプリに情報を渡したい場合は、「要求を返す」にチェックを入れます。

ユーザ属性は、「詳細を表示する」を選択すると一覧が表示されるので、設定したいものを探して設定してください。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/11.png" style="width:70%">
</figure>
{{< /rawhtml >}}

これで設定がユーザフローの作成が完了しました。

作成したユーザーフロー名を選択して、ユーザーフローの管理画面へ移動します。
## 動作確認

設定が完了したので動作確認をしてみましょう。

ユーザーフロー管理画面の上部に、「ユーザーフローを実行する」ボタンがあるので選択します。
ここで、先ほど作成したアプリケーションを選択して、「ユーザーフローを実行します」ボタンを選択します。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/12.png" style="width:70%">
</figure>
{{< /rawhtml >}}

実行するとまず初めにサインイン画面が表示されるはずです。
ここまで来たらユーザフローは、ひとまず完成です。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/13.png" style="width:70%">
</figure>
{{< /rawhtml >}}

サインアップをする場合は、Sign up now を選択します。
サインアップ画面では、先ほど指定したユーザ属性とメールアドレス、パスワードの入力欄が用意されています。

また始めにメールによる MFA をオンにしているのでメール認証を始めに行うようになっています。
メールアドレス入力後に、「Send verification code」 を選択すると、認証用コードがメールアドレスに送られるので、そのコードを入力します。
認証用コードを送るメールは、ユーザーフローでは、文面のカスタマイズが提供されていないので、カスタマイズしたい場合は、カスタムポリシーを使用します。

全て入力後に「Create」を選択すると、アカウントが発行され、指定したリダイレクト URL にリダイレクトします。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/14.png" style="width:70%">
</figure>
{{< /rawhtml >}}

作成されたユーザは、AAD の管理画面 > ユーザ の項目から確認が出来ます。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/15.png" style="width:70%">
</figure>
{{< /rawhtml >}}

先ほど入力したメールアドレスのユーザが登録されていたら成功です。

{{<figure src="../images/part2/b2c/16.png">}}

ユーザーフローは、外部 API の呼出し等、カスタムポリシーでしか出来なかった機能が徐々に追加されてきているので、メールのカスタマイズ等もどこかのタイミングで追加されないか期待して待ちたいですね

## 多言語対応

一通りユーザーフローでサインイン、サインアップを作成しました。
ユーザーフローは、デフォルトで英語なので、日本語に対応するように設定してみます。

設定は、ユーザーフローの管理画面 > 言語 の項目です。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/17.png" style="width:70%">
</figure>
{{< /rawhtml >}}

画面上部の「言語のカスタマイズを有効化」を選択すると、多言語機能が有効化されます。

{{<figure src="../images/part2/b2c/18.png">}}

追加したい言語を選択し、有効化をします。
また、既定に設定するとデフォルトの言語が、その言語に設定されます。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/19.png" style="width:70%">
</figure>
{{< /rawhtml >}}

翻訳は、既定の翻訳が提供されますが、独自にファイルをアップロードしてカスタマイズすることも可能です。

先ほどの翻訳を有効化した画面下部にある、「ページレベルのリソースファイル」から「既定値のダウンロード」を選択すると、ファイルがダウンロードできるので、
そのファイルを書き換えて再アップロードすると新しい翻訳が適用されます。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/20.png" style="width:70%">
</figure>
{{< /rawhtml >}}

翻訳を試す場合は、「ユーザーフローを実行する」の画面で、ローカライズ > ui_locales を「はい」にして言語を選択します。
ここで指定しない場合は、ブラウザの言語を基準に言語が選択されます。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/b2c/21.png" style="width:70%">
</figure>
{{< /rawhtml >}}

## ASP.NET Core に組み込んでみる

最後に、ASP.NET Core のアプリケーションに AAD B2C を組み込んでみます。

今回は、記事執筆時点での最新バージョンである、Visual Studio 2019 16.8.4 を対象とします。
また、英語版に準拠した説明なので、その他の言語で VS を使用している場合は、適宜読み替えてください。

ASP.NET Core の場合は、プロジェクト作成時の設定で B2C を組み込むことが可能です。

始めに、プロジェクト作成画面 > ASP.NET Core Web Application > Create でプロジェクトを作成します。

{{<figure src="../images/part2/vs/01.png">}}

Create を選択すると、アプリケーションの種類を選ぶ画面に遷移します。

適当にアプリケーションの種類を選択し(図では、MVC を選択) Authentication > change を選択します。

{{<figure src="../images/part2/b2c/02.png">}}

認証周りの設定画面が表示されるので、

Individual User Accounts > Connect to an existing user store in the cloud 

を選択します。

{{<figure src="../images/part2/b2c/03.png">}}

ここで、AAD B2C の値を入力していきます。

* Domain Name : B2C のドメイン名(先ほどメモした「ドメイン名.onmicrosoft.com」)
* Application ID : 先ほどメモした「アプリケーション(クライアント)ID」
* Sign-up or Sign-in Policy : 先ほど作成したサインイン、サインアップポリシー名(B2C_1_~)
* Reset Password Policy : パスワードリセット用のユーザーポリシー名(今回は、適当な値で OK です。)

次に、AAD B2C のアプリケーションへローカル環境のリダイレクト URL を設定します。

プロジェクトのプロパティ > Debug から、デバッグ用の URL をコピーします。


{{< rawhtml >}}
<figure style="text-align:center">
  <img src="../images/part2/vs/04.png" style="width:70%">
</figure>
{{< /rawhtml >}}

この URL を B2C の管理画面 > アプリの登録 > 先ほど登録したアプリ > 認証
でアプリに追加をします。

URL は、コピーした URL/signin-oidc を設定します。

{{<figure src="../images/part2/vs/05.png">}}

これで準備完了です。

アプリケーションを実行すると、右上に Sign In ボタンがあるのでそれを選択します。

{{<figure src="../images/part2/vs/06.png">}}


選択すると、B2C の画面へ遷移します。
ここで、先ほどの作成したアカウントでサインイン or 新規でサインアップすると、サインイン状態でアプリケーションにリダイレクトされ、認証処理が完了します。

## まとめ

今回は、ユーザーフローでお手軽に認証の仕組みを作る部分を説明しました。
基本的な認証、認可の仕組みは、ポータルの操作だけでほぼコードを書かずに実現が出来ました。
非常に手軽に構築が出来るので是非触ってみてください。

次の記事では、より柔軟にカスタムが出来るカスタムポリシーの説明を行いたいと思います。

[カスタムポリシーに続きます。](../azureadb2c-customflow/)