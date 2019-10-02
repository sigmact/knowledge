--- 
title: "記事ページテンプレート"
authors: [
    ["Chiho Otonashi","images/author/otns.png"],
]
weight: 2
date: 2019-10-02
description: 記事書き方の補足情報
type : "article"
keywords:
  - "word1"
  - "word2"
  - "word3"
eyecatch: "/images/hugo/hugo.png"
tocLevel: 3
---

## Front Matter 

### 目次の表示

記事ページの目次に表示する見出しの階層レベルを指定する
```html
tocLevel: 3 //H3まで目次に表示する
```

tocLevelを設定していない場合は、config.toml のarticleToCLevelの値が適用される
```html
[params]
articleToCLevel: 3 //H3まで目次に表示する
```

## Shortcodes
- [Hugo Document](https://gohugo.io/content-management/shortcodes/#shortcodes-with-markdown)

### pageinfo 

TODOやメモを記載用

{{< pageinfo >}}
{{&lt; pageinfo &gt;}}<br>
テキスト<br>
{{&lt; /pageinfo &gt;}}
{{< /pageinfo >}}

{{< pageinfo >}}
テキスト
{{< /pageinfo >}}

### table

レスポンシブ対応のtable

{{< pageinfo >}}
{{&lt; table &gt;}} <br>

| head  | head | head  | head | head  | head | head  | head | head  | head |<br>
|---------|--------|---------|--------|---------|--------|---------|--------|---------|--------|<br>
| cell     | cell   | cell     | cell   | cell     | cell   | cell     | cell   | cell     | cell   |<br>
| cell     | cell   | cell     | cell   | cell     | cell   | cell     | cell   | cell     | cell   |<br>
| cell | cell  | cell     | cell   | cell     | cell   | cell     | cell   | cell     | cell   |<br>

{{&lt; /table &gt;}}

{{< /pageinfo >}}

{{< table >}}
| head  | head | head  | head | head  | head | head  | head | head  | head |
|---------|--------|---------|--------|---------|--------|---------|--------|---------|--------|
| cell     | cell   | cell     | cell   | cell     | cell   | cell     | cell   | cell     | cell   |
| cell     | cell   | cell     | cell   | cell     | cell   | cell     | cell   | cell     | cell   |
| cell | cell  | cell     | cell   | cell     | cell   | cell     | cell   | cell     | cell   |
{{< /table >}}