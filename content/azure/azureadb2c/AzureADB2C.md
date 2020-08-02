---
title: "Webアプリの立上げと相性の良い Azure ADB2C　第1回(Azure AD B2C とは)"
authors:
  [
    ["Tsubasa Yoshino", "images/author/yoshinotsubasa.jpg"],
  ]
weight: 10
date: 2020-07-27
description: ""
type: "article"
eyecatch: "/images/eyecatch/deploy.png"
draft: true
---

## はじめに

Azure AD B2C はAzure ADの1サービスです。Azure AD B2C を使うと迅速に認証や認可部分の機能を立ち上げることができます。
ユーザー登録や情報更新、ログイン、パスワード変更といったアカウント機能は、自前で毎回作りこむとそれなりに大変ですが、
自分たちで作らずにサービスを利用した方が、サービスを手早く立ち上げられて安全という世の中になってきています。

## Azure AD B2Cとは

全体像画像

- コンシューマー向けクラウドID基盤
- Webアプリ、ネイティブアプリ、モバイルアプリをサポート
- AADの仕組みをコンシューマー向けに提供するイメージ
- オープンな標準プロトコルに対応(OpenID Connect,OAuth2.0,SAML)
- Twitter、Facebook、LINE等で認証が可能。
- 他のADもIdpとして利用可能
- MSの基盤でセキュアにコンシューマーのID管理ができる
- 大規模な案件にも対応
- 競合サービスはAuth0とAWSのCognito
- ただし、価格的にはAADが圧倒的に安い(後ほど記載)
- 顧客が使いたいIDプロバイダーを利用して顧客を安全に認証する
- 顧客のログイン、優先設定、変換データをキャプチャする

## 注意事項

- b2cextensions-app は自動で作られる
- b2cextensions-app はAzureのポータル上で触ってはいけない

## IDaaS導入のメリット

- センシティブな情報を直接扱わずに済む(実装ミスでDBが直接インターネットに公開されている等) 
- 認証方式の根本的な脆弱性
- パスワードの平文問題
- ログにパスワードが出てしまう問題
- 自前で作らなければ上記のような問題は起きない

### 複数アプリで共通基盤を利用できる

- 認証周りの実装コストが大幅に減る

### ハイパフォーマンス、高可用性を実現

- ユーザー管理がパフォーマンス不足だと、サービスの根本にかかわる問題になってしまう

### 認証を作るのはとても大変

- 大量の入力項目
- データのバリデーション
- ユーザーの重複チェック
- 大体似たようなサインアップサインイン画面
- セキュリティ担保
- アクセスの履歴管理
- ユーザー管理画面
- どう作っても大体似ているが、微妙に違う。共通化も結構大変。

## ID周りで項目追加した場合の修正範囲

### 自前の修正範囲

- 画面に項目追加
- デザイン調整
- DB定義の修正
- DBのモデル修正
- ViewModelの修正
- DBへの書き込み処理修正
- DBからの取得処理修正

### iDaaSの修正範囲

- 画面に項目追加
- デザイン調整

iDaaSを利用した方が、改修コストも少ない。

## AAD B2Cのメリット

- シングルサインオン
- 関連アプリに一貫したUXを提供
- 関連アプリを一か所で管理(アクセス管理、ユーザーメトリック)
- データに対してコンプライアンスポリシーの適用(セキュアに作れる)

## AAD B2C の料金体系

図(☆最新の)

- 50000認証までは無料MAU?
- MFA1回3.36円

### MFA

☆ふじえさんとQAした内容

- MFAは＊＊に対応している
- ＊＊Authenticator使いたいならカスタムが必要
  
### 競合サービスとの比較

図(☆最新の)

- Cognito　と Auth0は高い
- Auth0は価格がクローズドでもある

## どういった案件に向いているか

☆ここは以前検討したけど採用しなかったという内容ではなく、どういった案件に向いているか書いた方が良さそう

- コンシューマー向けサービスのアカウント管理
- こういった機能
- メール本文のカスタマイズは可能
- ただし、B2C側は　b2clogin.com というドメインで現状ホストされるので、それを許容できるかどうか
- b2clogin.com にカスタムドメインを当てるのは現状対応中の模様(こちらから投票しよう)

### Identity Server

- Identity Server とは☆
- Identity Serverを使って自作すれば、工数をかけて自由な仕様にすることができる(ただし、非機能要件に応える必要がある)

## 構成例

### 構成例1

☆画像と説明してね

最もシンプルな構成

### 構成例2

☆画像と説明してね

外部ユーザーストア

AADB2Cで基本的な認証を行った後で、外部のデータストアでユーザー情報を補完する構成

B2Cのフロー中でREST API を呼び出し、情報を追加してアプリに返すなど
CRMのユーザー情報と組み合わせるなど

### 構成例3

☆画像と説明してね

外部メールプロバイダ

[ユーザーフローに続きます。](/azure/azureadb2c/azureadb2c-userflow)