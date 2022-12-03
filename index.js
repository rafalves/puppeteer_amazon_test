const converter = require('json-2-csv');
const puppeteer = require('puppeteer');
const fs = require('fs'); 

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false,
        userDataDir: './tmp'
    });
    const page = await browser.newPage();
    await page.goto('https://www.amazon.com.br/s?k=iphone&crid=ID4E4GQ7YMT4&sprefix=celulares%2Caps%2C170&ref=nb_sb_ss_related-keywords-suggestions_1_9', {
        waitUntil: 'load'
    });

    const productsHandles = await page.$$('div.s-main-slot.s-result-list.s-search-results.sg-row > .s-result-item');
    let items = []
    let isBtnDisabled = false
    
    while(!isBtnDisabled) {
        await page.waitForSelector('.s-pagination-item.s-pagination-next')
        
        for (const productHandle of productsHandles) {
            let productPrice, productLink, productImageSrc, productTitle = 'Null'
            try {
                productPrice = await page.evaluate(el => el.querySelector('.a-price-whole').textContent, productHandle);
                if (productPrice) {
                    productTitle = await page.evaluate(el => el.querySelector('h2 > a > span').textContent, productHandle);
                    let productLinkRaw = await page.evaluate(el => el.querySelector('.a-link-normal').getAttribute('href'), productHandle);
                    productLink = 'https://amazon.com.br' + productLinkRaw
                    productImageSrc = await page.evaluate(el => el.querySelector('.s-image').getAttribute('src'), productHandle);
                    items.push({productTitle, productPrice, productImageSrc, productLink})
                    //console.log(productTitle)
                    //console.log(productPrice)
                    //console.log(productImageSrc)
                    //console.log('https://amazon.com.br' + productLink)
                    //console.log('.')
                }    
            } catch (err) {}
        }
        isBtnDisabled = await page.$('.s-pagination-item.s-pagination-next.s-pagination-disabled') !== null;
        console.log(isBtnDisabled)
        if (!isBtnDisabled) {
            try {
                //await page.waitForSelector('.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator')
                await page.click('.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator')
                //await page.waitForNavigation({waitUntil: 'networkidle2'})
            } catch (err){}
        }
        console.log(items.length)
    }


    await browser.close();
    // convert JSON array to CSV string
    converter.json2csv(items, (err, csv) => {
    if (err) {
      console.log('error csv')
    }
    fs.writeFileSync('items.csv', csv)
  })

})();