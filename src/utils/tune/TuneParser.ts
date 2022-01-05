import { Tune } from '@speedy-tuner/types';

class TuneParser {
  private isTuneValid = false;

  private tune: Tune = {
    constants: {},
  };

  parse(buffer: ArrayBuffer): TuneParser {
    const raw = (new TextDecoder()).decode(buffer);
    const xml = (new DOMParser()).parseFromString(raw, 'text/xml');
    const xmlPages = xml.getElementsByTagName('page');

    Object.keys(xmlPages).forEach((key: any) => {
      const page = xmlPages[key];
      const pageElements = page.children;

      Object.keys(pageElements).forEach((item: any) => {
        const element = pageElements[item];

        if (element.tagName === 'constant') {
          const attributes: any = {};

          Object.keys(element.attributes).forEach((attr: any) => {
            attributes[element.attributes[attr].name] = element.attributes[attr].value;
          });

          const val = element.textContent?.replace(/"/g, '').toString();

          this.tune.constants[attributes.name] = {
            value: Number.isNaN(Number(val)) ? `${val}` : Number(val),
            // digits: Number.isNaN(Number(attributes.digits)) ? attributes.digits : Number(attributes.digits),
            // cols: Number.isNaN(Number(attributes.cols)) ? attributes.cols : Number(attributes.cols),
            // rows: Number.isNaN(Number(attributes.rows)) ? attributes.rows : Number(attributes.rows),
            units: attributes.units ?? null,
          };
        }
      });
    });

    if (Object.keys(this.tune.constants).length > 0) {
      this.isTuneValid = true;

      return this;
    }

    return this;
  }

  getTune(): Tune {
    return this.tune;
  }

  isValid(): boolean {
    return this.isTuneValid;
  }
}

export default TuneParser;
