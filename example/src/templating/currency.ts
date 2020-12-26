import 'lynx-framework/templating';

@TemplateFilter('currency')
export function currency(val: any): string {
    if (val == undefined) {
        return val;
    }
    try {
        console.log('filtering ', val);
        var parts = val.toString().split('.');
        console.log('parts', parts);
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return parts.join(',');
    } catch (e) {
        console.log('error', e);
        return val;
    }
}
