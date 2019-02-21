# @umi-material/reactPdf

Rendering PDF by pdf.js, including lazy loading and page jump

## Usage

Install with yarn add react-better-pdf or npm install react-better-pdf

    import React, { Component } from 'react'
    import ReactPdf from 'inter-reactpdf'

    class index extends Component {

      onPdfLoaded = () => {
        console.log('pdf loaded')
      }

      render() {
        return (
          <ReactPdf
            url='your pdf data url'
            onPageChange={(currentPage, totalPageNum)}
            onPdfLoaded={this.onPdfLoaded}
            maxWidth={1440}
            worker={'https://xxx.worker.js'} // default is pdf.worker.js
          />
        )
      }
    }

export default index

## LICENSE

MIT
