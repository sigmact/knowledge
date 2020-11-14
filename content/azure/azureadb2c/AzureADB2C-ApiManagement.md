---
title: "Webアプリの立上げと相性の良い Azure ADB2C　第4回(API Management を AADB2C で保護する)"
authors:
  [
    ["Tsubasa Yoshino", "images/author/yoshinotsubasa.jpg"],
  ]
weight: 10
date: 2020-07-30
description: ""
type: "article"
category : "azure"
tags: ["Azure", "AADB2C", "Web Apps", "Azure AD B2C"]
eyecatch: "/images/eyecatch/deploy.png"
draft: true
---

## はじめに

### API Managementとは

- API保護、管理などゲートウェイ機能を提供するサービス
- APIを安全に外部公開できる
- 開発者向けのポータルも作れる

### API Managementの構成

- MSのサイトの画像

API ManagementはAPIゲートウェイ、Azure Portal、開発者ポータルの３つから構成されている

### APIゲートウェイ

- APIの受け口になる機能
- 実際に稼働するAPI部分を担当

### Azure Portal

- APIをセットするための管理画面
- ポリシー設定などAPIの設定部分を担当

### 開発者ポータル

- APIを使って開発を行う人向けの画面
- APIの紹介ページを作ることができる

## ポリシー

- リクエスト、レスポンスをAPIMで条件に応じて調整する機能
- リクエスト、レスポンスの書き換え、ログの出力
- Razor風なマークアップ言語で設定を記述する
- UAを見てPCとモバイルで内容を書き換える
- 特定のリクエストに対するレスポンスは内容をマスクして返す
  
## 構成例

### API Management を使用しない構成例

☆画像

- 呼び出しの回数制限をしたい場合などが大変
- ドメインが変わると変更が多くて大変
- レスポンスのキャッシュが欲しい

### API Management を使用した構成例

☆画像

- 呼び出し回数制限可能
- APIMのキャッシュ機能でレスポンスキャッシュを行う
- APIMを経由するのでdemo1だけドメインが変わってもアプリに影響なし☆意味良くわからん
- Redisに外部キャッシュを持たせることも可能 

## API Managementココが良い

- プロキシとして使える
- ばらばらに作られたAPIをまとめて管理もできる
- 提供側では、こっそり裏で改修がしやすい
- APIのモックが作れる
- 開発初期や単体テストで使うスタブがすぐ作れる
- ポリシーでアクセス制限可能
- 呼び出しのレートリミット
- ヘッダのチェック
- IP制限
- 従量課金がまだ日本に来ていない

## APIMの料金体系

☆スライド

## APIM をAADB2Cで保護する

- AADB2Cでサインインする
- AADB2Cにサインインしている場合のみ呼び出し可能にしたい
- サインイン済みの場合は、正しい結果を返す

### 構成例

☆画像

AADB2Cにサインイン状態なら、APIMを経由してAPI呼び出し可能

### やること

- APIM=ポリシーでJWTを確認する処理を追加する
- 呼び出し側＝リクエストにAADB2Cで取得したJWTを載せてリクエストを投げる

## 実装

☆動画の手順で宜しい気がする

JWTで保護されました

[AADB2CでLINEでログインに続きます。](/azure/azureadb2c/azureadb2c-linelogin)
