import { chromium } from 'playwright';

async function saveNoteAsPdf(url: string) {
  console.log('🚀 PDF作成を開始します...');
  
  // 個人のログイン情報を使わず、クリーンなブラウザを起動するように変更
  const browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log(`🔗 ページに移動中: ${url}`);
    // タイムアウト対策として 'load' を使用
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });

    // 学習用に不要な要素（ヘッダー・フッター・SNSボタン）を非表示にする
    await page.addStyleTag({ 
      content: `
        .note-common-header, 
        .note-common-footer, 
        .st-post-share, 
        .st-post-side, 
        .st-post-navigation,
        .l-container__aside { display: none !important; }
      ` 
    });

    console.log('📜 コンテンツを読み込むためにスクロール中...');
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 400; 
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    await page.waitForTimeout(2000); 

    const title = await page.title();
    const fileName = `note_${Date.now()}.pdf`;
    
    console.log(`📄 PDFを書き出しています: ${title}`);
    await page.pdf({
      path: fileName,
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' }
    });

    console.log(`✅ 完了しました！\nファイル名: ${fileName}`);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

// 実行時にURLを受け取る
const targetUrl = process.argv[2]; 
if (!targetUrl) {
  console.log('使用法: npx ts-node index.ts [noteのURL]');
} else {
  saveNoteAsPdf(targetUrl);
}