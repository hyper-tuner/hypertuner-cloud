import { TuneWithDetails } from '@speedy-tuner/types';

class TuneParser {
  private isTuneValid = false;

  private tune: TuneWithDetails = {
    constants: {},
    details: {
      author: '',
      tuneComment: '',
      writeDate: '',
      fileFormat: '',
      firmwareInfo: '',
      nPages: 0,
      signature: '',
    },
  };

  parse(buffer: ArrayBuffer): TuneParser {
    const raw = (new TextDecoder()).decode(buffer);
    const xml = (new DOMParser()).parseFromString(raw, 'text/xml');
    const xmlPages = xml.getElementsByTagName('page');
    const bibliography = xml.getElementsByTagName('bibliography')[0].attributes as any;
    const versionInfo = xml.getElementsByTagName('versionInfo')[0].attributes as any;

    this.tune.details = {
      author: bibliography.author.value,
      tuneComment: `${bibliography.tuneComment.value}`.trim(),
      writeDate: bibliography.writeDate.value,
      fileFormat: versionInfo.fileFormat.value,
      firmwareInfo: versionInfo.firmwareInfo.value,
      nPages: Number.parseInt(versionInfo.nPages.value, 2),
      signature: versionInfo.signature.value,
    };

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
    }

    if (this.tune.details.signature.match(/^speeduino \d+$/) === null) {
      this.isTuneValid = false;
    }

    return this;
  }

  getTune(): TuneWithDetails {
    return this.tune;
  }

  isValid(): boolean {
    return this.isTuneValid;
  }
}

export default TuneParser;
