async function filter_products(filterValues) {
    let queryString = "";
    for(let k of Object.keys(filterValues)) {
        if(queryString.length)
            queryString += "&";
        queryString += `${k}=${encodeURIComponent(filterValues[k])}`;
    }
    const final_url	= '/api/refri_filters' + (queryString.length ? '?' + queryString : "");
    const res 		= await fetch(final_url);
    return await res.json();
}

function html_product_list(products) {
    function html_product_item(product) {
        productHtmlRow = '<tr>';
        for(let k of Object.keys(product))
            productHtmlRow += `<!-- td>${k}</td --><td>${k != 'image_url' ? product[k] : `<img src="${product[k]}"></img>`}</td>`;
        productHtmlRow += '</tr>';
        return productHtmlRow;
    }
    result = '';
    products.forEach(product => { result += html_product_item(product); });
    return result;
}

async function refri_filters() {
    let htmlkeyword     = document.getElementById('keyword')
    let htmlminTemp     = document.getElementById('minTemp')
    let htmlmaxTemp     = document.getElementById('maxTemp')
    let htmlminPeak     = document.getElementById('minPeak')
    let htmlmaxPeak     = document.getElementById('maxPeak')
    let htmlminAverage  = document.getElementById('minAverage')
    let htmlmaxAverage  = document.getElementById('maxAverage')
    let filterValues	= {};
    if(htmlkeyword  ) filterValues.keyword	    = htmlkeyword  .value;
    if(htmlminTemp     ) filterValues.minTemp   	= htmlminTemp    .value;
    if(htmlmaxTemp     ) filterValues.maxTemp   	= htmlmaxTemp    .value;
    if(htmlminPeak     ) filterValues.minPeak   	= htmlminPeak    .value;
    if(htmlmaxPeak     ) filterValues.maxPeak   	= htmlmaxPeak    .value;
    if(htmlminAverage  ) filterValues.minAverage	= htmlminAverage .value;
    if(htmlmaxAverage  ) filterValues.maxAverage	= htmlmaxAverage .value;
    products = await filter_products(filterValues);
    const product_table = document.getElementById('refri_list');
    product_table.innerHTML = products.length ? html_product_list(products) : '<tr><td>No refrigerators found</td></tr>';
}