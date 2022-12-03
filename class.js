const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await pageLast.goto('https://www.amazon.com.br/s?k=iphone&s=price-asc-rank&page=7&crid=ID4E4GQ7YMT4&qid=1670015749&sprefix=celulares%2Caps%2C170&ref=sr_pg_7', {
        waitUntil: 'load'
    })

    await page.goto('https://www.amazon.com.br/s?k=iphone&crid=ID4E4GQ7YMT4&sprefix=celulares%2Caps%2C170&ref=nb_sb_ss_related-keywords-suggestions_1_9', {
        waitUntil: 'load'
    })

    const is_disabled = await page.$('.s-pagination-item.s-pagination-next.s-pagination-disabled') !== null;

    console.log(is_disabled)

    await browser.close();
})();