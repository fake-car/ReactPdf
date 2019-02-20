import React, { Component } from 'react'
import styles from 'index.less'
import PdfJsLib from 'pdfjs-dist'
import PropTypes from 'prop-types'
import { id } from 'postcss-selector-parser';

const prePage = 'page-'

class index extends Component {

  static propTypes = {
    url: PropTypes.string.isRequired, // pdf url
    onPageChange: PropTypes.func, // calls when page changes
    onPdfLoaded: PropTypes.func
  }

  static defaultProps = {
    url: '',
  }

  state = {
    numPages: 0,
    currentPage: 1,
    pdf: null,
  }

  pagesData = []

  /**
   * render pdf by url
   */
  renderPdf = (url) => {
    const {
      url,
      onPdfLoaded,
      onPageChange
    } = props
    if (!url) {
      return
    }
    PdfJsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.js')
    PdfJsLib.getDocument(url)
    .then(pdf => {
      const {
        pdfInfo
      } = pdf
      const {
        numPages
      } = pdfInfo
      onPdfLoaded && onPdfLoaded()
      for (let i = 0; i< numPages; i += 1) {
        this.pagesData.push({
          rendered: false,
          redering: false,
          singlePageHeight: 0,
        })
      }
      onPageChange && onPageChange(1, this.pagesData.length)
      // initialize
      this.setState({
        pdf,
      }, () => {
        // resize every page
        const pdfView = document.getElementById('pdfView')
        const contentWidth = pdfView.clientWidth
      })
    })
  }

  render() {
    return (
      <div
        className={styles.container}
      >
        <div
          className={styles.pdfView}
          id='pdfView'
        >
          {pagesData.map((item, idx) => {
            <div
              className={styles.page}
            >
              <canvas
                ref={element => this[prePage + idx] = element}
                className={styles.layer}
              />
            </div>
          })}
        </div>
      </div>
    )
  }
}

export default index
