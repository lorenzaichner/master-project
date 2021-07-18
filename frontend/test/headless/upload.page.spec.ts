const Nightmare = require('nightmare');
require('nightmare-upload')(Nightmare);
const chai = require('chai');
import { expect } from 'chai';
import { TestUtil } from './util/test.util';

describe('Upload page', () => {
  it('upload a file and view the returned features', function(done) {
    const nightmare = Nightmare();
    nightmare
      .goto('http://localhost:8080')
      .click('[href="#upload-page"]')
      .upload('#file', `${process.cwd()}/test/data/simple_data_1.csv`)
      .click('[type="submit"]')
      .wait(1500)
      .evaluate(t => {
        return document.querySelector(t).innerHTML;
      }, '#features')
      .then(res => {
        const split = res.split('</li>').map(r => r.replace('<li>', ''));
        const expected = ['enabled', 'running', 'blocked', 'level', 'test', 'timed', 'something'];
        expect(split.length).to.equal(8); // last one is empty string
        for(let i = 0; i < 7; i++) {
          expect(split[i]).to.equal(expected[i]);
        }
        nightmare.end();
        done();
      })
      .catch(err => {
        console.log(`Failed, err: ${err}`);
        nightmare.end();
        done();
      });
  }, 10000);

  it('click the "Upload file" button without previously selecting a file prints error', function(done) {
    const nightmare = Nightmare();
    nightmare
      .goto('http://localhost:8080')
      .click('[href="#upload-page"]')
      .click('[type="submit"]')
      .evaluate(t => {
        return document.querySelector(t).textContent;
      }, '#status-line-wrapper span')
      .then(res => {
        expect(res.includes('no file selected')).to.be.true;
        nightmare.end();
        done();
      })
      .catch(err => {
        console.log(`Failed, err: ${err}`);
        nightmare.end();
        done();
      });
  }, 10000);

  it('uploading a file with empty column values prints an error', async function () {
    const nightmare = Nightmare();
    const testUtil = new TestUtil(nightmare);
    await testUtil.startup();
    await testUtil.expectUploadPageError('with_order_column.csv', 'data file contains rows with no values');
    await nightmare.end();
  }, 10000);
});

