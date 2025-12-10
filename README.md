Projekt: Image Optimizer
Autor: Dan Oujeský

Popis:
Jednoduchá webová aplikace pro nahrávání obrázků, jejich převod do formátu .webp a stažení jako ZIP.

Spuštění:
1. Nainstalujte závislosti: "npm install"
2. Spusťte server: "npm run dev"
3. Otevřete v prohlížeči: "http://localhost:5000"
4. Klikněte na "UPLOAD" -> vyberte obrázky, pak "CONVERT" pro převod obrázků do formátu .webp a nakonec "DOWNLOAD" pro stažení všech obrázku v zip složce.

- Podporované formáty jsou všechny obrázkové soubory (`image/*`), převod je do formátu .webp.
- Dočasné soubory se ukládají do `temp/` a automaticky se mažou po stažení nebo odpojení klienta.


