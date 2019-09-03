---
title: "Hugoカスタマイズ方法まとめ"
authors: [
    ["Keiichi Hashimoto","images/author/k1hash.png"],
    ["Takekazu Omi","images/author/omi.png"]
]
weight: 1
date: 2019-08-24
description: Hugoのカスタマイズ方法をまとめる
type : "article"
keywords:
  - "word1"
  - "word2"
  - "word3"
eyecatch: "/images/hugo/hugo.png"
tocLevel: 3
---


## 開発の進め方

- Hugoでサイトを作る場合、「layouts」(=HTML)で画面を構成するテンプレートを作り、「content」(=markdown)に記事をつくる2段構成になる。
- 「layouts」内直下の index.htmlがトップページ。
- Front MatterがMarkdownで作成する記事のメタ部分

## テンプレートの基本構造

- layoutsフォルダ配下にある
- layouts/_default/baseof.html がTOPと一覧のベース
- layouts/partial の部品を呼び出している
- テンプレートの種類と呼び出し順　https://maku77.github.io/hugo/layout/template-types.html
- 記事詳細に関しては、layouts/_default/single.html

### Section

- 特定の階層のTOP(１階層目TOP、２階層目TOP)
- 下記のファイルの内、最初に見つかったテンプレートファイルがセクションテンプレートとして使用されます。

- /layouts/section/＜セクション名＞.html
- /layouts/＜セクション名＞/list.html
- /layouts/_default/section.html
- /layouts/_default/list.html
- /themes/＜テーマ名＞/layouts/section/＜セクション名＞.html
- /themes/＜テーマ名＞/layouts/＜セクション名＞/list.html
- /themes/＜テーマ名＞/layouts/_default/section.html
- /themes/＜テーマ名＞/layouts/_default/list.html

### partials

- layouts/partial/head.html がヘッダ情報
- layouts/partial/footer.html がフッタ情報
- layouts/partial/banner.html がif .IsHomeの時だけ呼ばれる実装に今回なっているヒーローイメージ部分

```html
<!DOCTYPE html>
<html lang="{{ with .Site.LanguageCode }}{{ . }}{{ else }}en-US{{ end }}">
    {{- partial "head.html" . -}}
    <body>
        {{ if .IsHome }}
        {{ "<!-- header -->" | safeHTML }}
        <header class="hero-section overlay bg-cover banner" data-background="{{ .Site.Params.banner.image | absURL }}">
            <div class="container mb-100">
                {{ "<!-- navigation -->" | safeHTML }}
                {{ partial "navigation.html" . }}
                {{ "<!-- /navigation -->" | safeHTML }}
            </div>
        {{ partial "banner.html" . }}
        </header>
        {{ "<!-- /header -->" | safeHTML }}
        {{ else }}
```

- IsHomeとは、/ ルートディレクトリかどうかを判定するもの　参考 https://gohugo.io/variables/site/#site-pages 
- banner.htmlという名前ではなくて、heroimageという部品でもよいかも。
  
### shortcodes

- shortcodesフォルダに独自のshortcodesを置く(今回は、TODOやメモを記載するpageinfo.htmlを用意)
- 

### ソースコードに散見されるsafeHTML関数

- safeHTML関数＝ 安全な HTML ドキュメントとして宣言するための関数。
- Hugo のテンプレートエンジンは、コンパイルの際に HTML タグをエスケープした文字列として取得する。
- このsafeHTML関数を使用することで、 HTML タグがエスケープされない状態で取得されます。
- 例：関数を使用しない場合、<は&lt;、>は&gt;にエスケープされる

## Front Matter 
### tocLevel

- 記事ページ内の目次に表示する見出しの階層レベルを指定する
```html
---
tocLevel: 3 //H3まで目次に表示する
---
```
- 指定しない場合はデフォルト値：6　(H6まで)

## TODO

### 全体

- 全体的なデザイン
- pageinfoのCSSを作る
- listのCSSを作る、・がない。

### TOP(index.html)

- トピックスは、２階層目にある_index.md のFront Matterで指定したtype=「category_top」の内容を書きだしている

### カテゴリTOP(list.html)

- どうするか
- 記事へのリンクが左のバーにも右のバーにもある（まあいい？

### 記事ページ(single.html)

- デザインを整える。
- ページ内リンクの位置が微妙にずれているので調整
- ページ内リンクへのアクセスを提供するサイドバーを作る
- SNSへリンクしているところのデザインやスタイルを整える
- h1,h2,h3タグにアンカーをつけるのはこちらのソースを拝借　https://discourse.gohugo.io/t/adding-anchor-next-to-headers/1726/13

### 他優先度の低いもの

- 後々多言語にするときの方法
