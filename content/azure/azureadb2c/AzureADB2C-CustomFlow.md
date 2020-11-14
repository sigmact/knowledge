---
title: "Webアプリの立上げと相性の良い Azure ADB2C　第3回(カスタムフローとは)"
authors:
  [
    ["Tsubasa Yoshino", "images/author/yoshinotsubasa.jpg"],
  ]
weight: 10
date: 2020-07-29
description: ""
type: "article"
category : "azure"
tags: ["Azure", "AADB2C", "Web Apps", "Azure AD B2C"]
eyecatch: "/images/eyecatch/deploy.png"
draft: true
---

## はじめに

☆カスタムフローとは

- 複雑な要件用のカスタマイズ(XMLによるカスタマイズ)
- 細かいフローの制御ができるので、概ね要求が満たせる
- 実際運用にのせるには、こちらの方が現実的

## 事例

弊社で作った事例を紹介します。

- ☆セイリンの例をロゴを消して画像で
- 認証用のコードがメールで届く
- パスワードを入れる
- こんな感じのものが簡単に作れるようになります
- レアルマドリードの公式サイトのアカウント管理もAADB2Cで実装されています

## カスタムフローで出来ること

- 画面デザインの変更(CSS＋JS)
- 収集項目の追加削除
- 項目のバリデーション変更
- メールプロバイダの変更
- 各フローで外部サービスとの連携(外部のREST APIを叩くなど)  
- カスタム方法(HTMLの修正、XMLで細かくフローを制御)

## カスタムフローのひな型

- GitHubからダウンロード可能
- MS公式ドキュメント

## バリデーションの変更

- 入力項目のバリデーション処理をカスタマイズ
- 正規表現を使用してバリデーションを作る
- メールアドレス、名前、住所
- 名前に数字やアルファベットを使えなくする等

### バリデーションの実装例

☆画面やコード例と一緒に

- メアドのバリデーションを変更してみる
- RFC違反のメアドを使いたい場合は、こう
- 正規表現を変える
- ☆コードをアップする？ポリシーをアップロード？
- エラーが出たら詳細を教えてくれる

## メールプロバイダの変更

- メールの送信処理をAADB2Cの内部から外部のプロバイダに切り替える
- Mailjet、SendGrid、SparkPostなどのSaaSを利用可能
- REST APIがあるメールプロバイダならある程度対応可能

### メールプロバイダ変更の実装例

☆画面やコード例と一緒に
☆構成例の画像

- SendGridのアカウント開設(省略)
- SendGridでメールテンプレートを作る(省略)
- SendGridに変数定義する
- Claim　AADB2Cにおいて、値を渡すためのオブジェクトのようなもの
- ClaimTypeの例
- OneTimePassword
- RequestBody
- VerificationCode=OTP入力用のテキストボックス
- SendGridのAPI用に、入力をJSONに変換する処理を作る
- ClaimTransformationを利用する
- C#で書いたイメージ
- 画面コントロールを作る
- メールアドレスとOtpを入力するコントロールを配置
- DisplayClaim＝ユーザーからの入力を受け付ける
- OutputClaim＝このコントロール用に一時保存される項目
- Action＝画面内で実行される処理

## REST APIの呼び出し

- 独自のREST API を呼び出すことが可能
- 認証時に外部のAPIからも情報を取得して、情報の補完が可能
- Dynamics、Salesforceのようなツールとも連携可能
- 複雑な入力検証を外部のAPIに投げることも可能

### 例

- ☆何か例があれば(コードとかだけでもよい)
- Technical Profileを定義？

## サンプルのダウンロード

- テンプレートこちらから
- カスタムポリシーこちらから

[APIマネジメントで認証を保護するに続きます。](/azure/azureadb2c/azureadb2c-apimanagement)
