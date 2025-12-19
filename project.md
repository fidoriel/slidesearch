python types: backend/pytypes.py

ich baue eine superschnelle slide suchmaschiene, die superschnell und scoped auf alle slides, alle slides aus einer lecture series oder slides aus ausgewählten lecture series

Dafür muss man crud auf lecture series machen können, genau so wie auf slide deck.

bei einer suche werden mit pdfjs links die slides angezeigt und rechts metadata und ggf scraped info.
alle slides werden nach dem upload in bytes gehalten, in bilder zerhackt, jedes bild an deepseek ocr ollama geschickt für ocr und dann alle informationen in slide gespeichert.
slide wird dann an meilisearch gesendet und indiziert.
valkey speichert so oft wie es geht. bei server start wird ein mal geschaut, dass meilisearch aktuell ist, ggf, nachgeladen.
schreibe eine funktiion zum dumpen und laden des valkey contents.

react UX:
gibt eine hirarchie aus
LectureSeries hat viele slide decks

fastapi backend:
/api/\*
