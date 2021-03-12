---
title: "DB 定義管理ツールを CI する"
authors: [
    ["Tsubasa Yoshino", "images/author/yoshinotsubasa.jpg"]
]
weight: 1
date: 2021-03-09
description: "dbdocsは、Holistics 社が開発する DB 定義管理、ビジュアライズツールです。DBMLと呼ばれる DSL を使用して DB 定義を記述することが出来、記述した定義をビジュアライズしてくれます。"
type: "article"
category : "azure"
tags: ["Azure", "Azure DevOps", "Azure Pipelines", "dbdocs"]
eyecatch: "images/eyecatch/deploy.png"
---

## はじめに

DB のスキーマ定義は、普段どんなツールを使うでしょうか。
よく見るパターンだと、Excel やそれに準ずる表計算ツールを使用したスキーマ定義をよく見ます。

簡単なスキーマでしたら、Excel でも必要十分だと感じますが、リレーションシップが複雑になったり、
テーブル数が増えてきたりすると、管理が煩雑になったり管理が大変な印象があります。

また見た目の部分でも、Excel ですと作りこみをしないと見辛いといった印象を持っています。

そこで最近社内で使用し始めた DB 定義管理ツールである dbdocs を紹介します。

## dbdocs とは、

[dbdocs](https://dbdocs.io) は、[Holistics 社](https://www.holistics.io/about-us/) が開発する DB 定義管理、ビジュアライズツールです。

[DBML](https://www.dbml.org/home/) と呼ばれる DSL を使用して DB 定義を記述することが出来、記述した定義をビジュアライズしてくれます。

npm 経由でインストールし、コマンドラインベースで実行することが出来るため、様々な環境で実行することが出来ます。

## DBML について

dbdocs を説明する前に簡単に DBML についてご紹介します。

DBML は、オープンソースな DSL で、Holistics 社がメンテナンスをしています。
元々は、[dbdiagram.io](https://dbdiagram.io/home) のために 2018 年に誕生した言語です。

記述は、非常に簡単です。
サンプルのテーブル定義を次に示します。

```
Project Demo {
    database_type: 'SQL Server
}

Table Book {
  Id int [pk, note: "Id"]
  Title nvarchar(128) [not null, note: "名前"]
}

Table BookDetail {
  BookId int [pk, note: "本のId"]
  Body nvarchar [not null, note: "説明文"]
}

Ref: Book.Id - BookDetail.BookId
```

これは、Book と BookDetail という二つのテーブルが、Id をキーにして One to One の関係でリレーションが張られている状態を表します。

これをビジュアライズすると次のようなダイアグラムが生成されます。

{{< rawhtml >}}
<figure style="text-align:center">
    <img src="../images/dbdocs/diagram01.png">
</figure>
{{< /rawhtml >}}

DBML の詳しい文法については、[こちら](https://www.dbml.org/docs/) をご参照の程

## dbdocs を動かす
### dbdocs のインストール

早速 dbdocs をインストールしてみましょう
前提条件として、npm と NodeJS がインストール済み環境をご用意ください。
また、アカウント周りで GitHub アカウントが必須なので、GitHub のアカウントもご用意ください。

今回の実行環境は、

* PowerShell 6.2.4
* npm 6.13.4
* NodeJS 12.16.1

です。

npm でインストールするだけで環境構築が出来るので、次のスクリプトを実行します。

```
npm install dbdocs -g
```

今回は、dbdocs 0.4 以降を想定しているので、dbdocs -v で、バージョンが 0.4 以上であることを確認してください。

今回の環境では、次の様になります。
```
dbdocs/0.4.0 win32-x64 node-v12.16.1
```

次に、dbdocs にログインします。


```
dbdocs login
```

このコマンドを実行すると、ログイン画面が立ち上がるので、GitHub のアカウントでログインします。

{{< rawhtml >}}
<figure style="text-align:center">
    <div style="display:flex; flex-wrap: wrap;">
        <img style="width: calc(100% / 2)" src="../images/dbdocs/dbdocs01.png">
        <img style="width: calc(100% / 2)" src="../images/dbdocs/dbdocs02.png">
    </div>
</figure>
{{< /rawhtml >}}

ログインするとトークンが取得できるので、それをコピーしてコマンドラインに貼り付けます

これでログイン完了です。

次に、DB ファイルをビルドします。

下記のコマンドでビルドをします。

```
dbdocs build "dbml ファイルパス"
```

成功すると、次のようにメッセージと、ビルド結果が展開された URL が表示されます。

```
√ Parsing file content
√ Done. Visit: 結果の URL

i Thanks for using dbdocs! We'd love to hear your feedback: https://form.jotform.com/200962053361448
```
結果の URL は、https://dbdocs.io/GitHubアカウント名/Project名 で生成されます。

生成結果にアクセス制限を設けたい場合は、パスワードの設定が可能です。

次のコマンドでパスワードを設定できます。

```
dbdocs password --set パスワード --project プロジェクト名
```

これにより、アクセス時にパスワードが求められるようになります。

dbdocs の基本的な使い方は、以上です。

## Azure Pipelines で dbdocs を使用する

次に、今回の本題である dbdocs を CI サービスから更新する方法についてです。

今回は、Azure Pipelines をターゲットとしていますが、基本的なことは、GitHub Actions などの CI サービスでも同じです。

はじめに CLI でログインするためのトークンを取得します。

dbdocs にログイン済みのコンソールで次のコマンドを実行すると、ログイン用のトークンが生成されます。

このトークンは、再度表示できないものなので、どこかにコピーしておきます。

```
dbdocs token -g
```

ここで出力されたトークンを DBDOCS_TOKEN という名前で環境変数に登録すると、dbdocs は、そのトークンを使用してログインを試みます。

Azure Pipelines の場合は、yaml にべた書きしないように、Environment Variables に格納します。

設定は、Yaml エディタの右上に配置されている Variables ボタンから行います。

{{< rawhtml >}}
<figure style="text-align:center">
    <img src="../images/dbdocs/dbdocs03.png">
</figure>
{{< /rawhtml >}}

適当な名前を付けて、トークンを登録します。

{{< rawhtml >}}
<figure style="text-align:center">
    <img src="../images/dbdocs/dbdocs04.png">
</figure>
{{< /rawhtml >}}

登録の際、Keep this value secret を指定すると、secret 扱いで外から見えなくなるのでチェックを入れます。

次に、CI 用の yaml を定義します。
次のように、今までのコマンドを流すだけの簡単なスクリプトです。

``` yaml
trigger:
  branches:
    include:
      - master
      - dev
  paths:
    include:
      # docs/db/配下のファイルが更新されたら実行する
      - 'docs/db/*'

stages:
  - stage: Build
    jobs:
      - job: Build
        pool:
         vmImage: 'ubuntu-latest'
        steps:

        - task: CmdLine@2
          # dbdocs をインストール
          displayName: 'Install dbdocs'
          inputs:
            script: 'sudo npm install -g dbdocs'
        
        - task: CmdLine@2
          # 一応インストール出来てるか確認
          displayName: 'Check dbdocs'
          inputs:
            script: 'dbdocs'

        - task: CmdLine@2
          displayName: 'Build dbdocs'
          #環境変数にトークンをセット
          env:
            DBDOCS_TOKEN: $(Secret 名)
          inputs:
            script: 'dbdocs build dbmlのファイルパス'
```

yaml の内容としては、かなりシンプルなモノになっています。

これにより、ファイルが更新されたら dbdocs も自動で更新されるようになります。

## まとめ

dbdocs を使用すると、複雑な DB 構成も比較的簡単に設計することが出来ます。
また、CI と組み合わせることによって、ドキュメントを更新したがビルドをし忘れた、テストで変更したものを本番に
反映し忘れたといったことを未然に防ぐことが出来ます。

dbdocs は、DB 設計をする際にかなり役に立つツールなので、ぜひ使ってみてください。