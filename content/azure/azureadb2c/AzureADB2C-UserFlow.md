---
title: "Webアプリの立上げと相性の良い Azure ADB2C　第2回(ユーザーフローとは)"
authors:
  [
    ["Tsubasa Yoshino", "images/author/yoshinotsubasa.jpg"],
  ]
weight: 10
date: 2020-07-28
description: ""
type: "article"
eyecatch: "/images/eyecatch/deploy.png"
draft: true
---

## はじめに

☆ユーザーフローとは
☆全般的に動画に近い感じで画像を付けて説明してほしい(↓50分くらいから)
https://1drv.ms/v/s!AnPJdc1518xtgb016R6vficYEpkOiw?e=7BtU8w

### ユーザーフロー

- 簡易的なカスタマイズ
- CSSとJSを使って画面デザインの変更
- 決められた箇所にB2CがDOMを挿入する
- 収集項目の追加と削除
- 画面ポチポチで項目変更
- JSの制約☆スライドから転記
- 画面ポチポチの制約(名前とデータ型と備考欄)
- 細かいフロー制御ができない
- ドキュメント的には、こちらが推奨されている

## アプリの登録

☆画像
どういう組織で使うか
このAADB2Cが登録されているサブスクリプションのAAD
任意の組織のディレクトリ名のアカウント

基本情報をアプリに入れてあげると繋がる

## 作成

サインインサインアップV2
使いたいIDプロバイダーを登録（MSアカウント、Emailサインアップ、デモAAD）
多要素認証をON

属性＝サインアップの時に情報収集するようになる

### アプリケーション要求を返す

サインインした後にこの情報を返すようになる
カスタムページを返すための
国
名前
住所

## 動作確認

サインアップ
VerifyCodeが届く
日本語に変えるのも容易

最終的にうまくいくと応答URLに戻る

ユーザーフローは今後のバージョンアップが非常に楽しみです。

## 簡単に組み込みたい場合

☆VSからこうする
Authentication　の部分を＊＊にする
B2Cのドメイン名と発行される＊＊＊
ポリシーの名前を入れてあげると、これで簡単につながる

[カスタムフローに続きます。](/azure/azureadb2c/azureadb2c-customflow)