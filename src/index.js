import React, { Component } from 'react'
import styles from './index.less'
import PdfJsLib from 'pdfjs-dist'
import PropTypes from 'prop-types'

const pdfJs = 'https://github.com/mozilla/pdf.js/blob/master/src/pdf.js'
const wrapper = 'div-wrapper-'
const prePage = 'canvas-page-'

class index extends Component {

  static propTypes = {
    url: PropTypes.string.isRequired, // pdf url
    onPageChange: PropTypes.func, // calls when page changes
    onPdfLoaded: PropTypes.func,
    maxWidth: PropTypes.number, // max width of the viewport
    worker: PropTypes.any // custom worker
  }

  static defaultProps = {
    url: '',
    maxWidth: 1100,
    work: require('pdfjs-dist/build/pdf.worker.js'),
  }

  state = {
    numPages: 0,
    currentPage: 1,
    pdf: null,
    pages: [],
  }

  pagesData = []

  /**
   * render pdf by url
   */
  renderPdf = () => {
    const {
      url,
      onPdfLoaded,
      onPageChange,
      maxWidth,
      worker
    } = this.props

    if (!url) {
      return
    }
    PdfJsLib.GlobalWorkerOptions.workerSrc = worker
    PdfJsLib.getDocument(url)
    .then((pdf) => {
      const {
        _pdfInfo
      } = pdf
      const {
        numPages
      } = _pdfInfo
      onPdfLoaded && onPdfLoaded()
      let pages = []
      for (let i = 0; i< numPages; i += 1) {
        pages.push({
          id: i
        })
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
        pages,
      }, () => {
        // resize every page
        const pdfView = document.getElementById('pdfView')
        const contentWidth = pdfView.clientWidth
        for (let j =0; j < pages.length; j += 1) {
          pdf.getPage(j + 1)
          .then(page => {
            console.log(this)
            let scale = 1 // origin
            const oldViewport = page.getViewport(scale)
            if (contentWidth > maxWidth) {
              scale = maxWidth / oldViewport.width
            } else {
              scale = contentWidth / oldViewport.width
            }
            const viewport = page.getViewport(scale)
            // wrapper
            const wrapperView = this[wrapper + j]
            wrapperView.style.width = `${viewport.width}px`
            wrapperView.style.height = `${viewport.height}px`
            // canvas
            const canvas = this[prePage + j]
            canvas.width = viewport.width
            canvas.height = viewport.height
            canvas.setAttribute('data-scale', scale)
            // update each page's height
            this.pagesData[j].singlePageHeight = viewport.height + 8
            // first render
            if (j === this.pagesData.length - 1) {
              this.firstRender()
            }
          })
        }
        // add observer for monitoring scroll-height
        this.addObserverForPdfContent()
      })
    })
  }

  // first render
  firstRender = () => {
    const {
      pdf,
      numPages
    } = this.state
    // calculate page's height
    const content = document.getElementById('pdfView')
    const visiblePageNum = this.getPageNumByHeight(content.clientHeight) + 1
    for (let idx = 0; idx < visiblePageNum; idx += 1) {
      if (idx > numPages) {
        return
      } else {
        this.renderPdfByPageNum(idx, pdf)
      }
    }
  }

  // observer
  addObserverForPdfContent = () => {
    const {
      pdf,
      currentPage
    } = this.state
    const {
      onPageChange
    } = this.props
    const content = document.getElementById('pdfView')
    content.addEventListener('scroll', e => {
      const pageNum = this.getPageNumByHeight(content.scrollTop)
      if (pageNum + 1 !== currentPage) {
        this.setState({
          currentPage: pageNum + 1
        })
        onPageChange && onPageChange(pageNum + 1, this.pagesData.length)
      }
      // redo render to avoid render failed
      if (pageNum > 0) {
        this.renderPdfByPageNum(pageNum, pdf)
      }
      this.renderPdfByPageNum(pageNum + 1, pdf)
    })
  }
  
  removeObserver () {
    const content = document.getElementById('pdfView')
    content.removeEventListener('scroll', null)
  }

  // render any of page pdf
  renderPdfByPageNum = (pageNum, pdf) => {
    if (pageNum > this.pagesData.length - 1) {
      return
    }
    // single page data
    const singlePageData = this.pagesData[pageNum]
    if (!(singlePageData.rendering || singlePageData.rendered )) {
      pdf.getPage(pageNum + 1)
      .then(page => {
        singlePageData.rendering = true
        // get canvas
        const canvas = this[prePage + pageNum]
        const scale = canvas.getAttribute('data-scale')
        // canvas's scale
        const viewport = page.getViewport(scale)
        const context = canvas.getContext('2d')
        let renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        page.render(renderContext).then(() => {
          singlePageData.rendered = true
          singlePageData.rendering = false
          // update
          console.log('page rendered')
        }).catch(error => {
          singlePageData.rendering = false
        })
      }).catch(err => {
        console.log(err)
      })
    }
  }

  // calculate page number by height
  getPageNumByHeight = (height) => {
    const {
      pdf
    } = this.state
    if (!pdf) {
      return
    }
    let totalHeight = 0
    let pageIndex = 0
    for (let i = 0; i < this.pagesData.length; i += 1) {
      totalHeight += this.pagesData[i].singlePageHeight
      if (totalHeight >= height) {
        pageIndex = i
        break
      }
    }
    return pageIndex
  }

  // calculate height by page number
  calculateScrollHeightByPageNum = (pageNum, topNum, content) => {
    console.log(topNum)
    let totalHeight = 0
    for (let i = 0; i <= pageNum; i += 1) {
      let currentPageHeight = this.pagesData[i].singlePageHeight
      if (pageNum > 0 && (i != pageNum - 1)) {
        totalHeight += currentPageHeight
      } else {
        totalHeight += currentPageHeight - topNum - content.clientHeight / 2
      }
    }
    return totalHeight
  }

  componentDidMount () {
    this.renderPdf()
  }

  componentWillUnmount () {
    this.removeObserver()
  }

  render() {
    const {
      pages
    } = this.state
    return (
      <div
        className={styles.container}
      >
        <div
          className={styles.pdfView}
          id='pdfView'
        >
          {pages.map((item, idx) => {
            return (
              <div
                className={styles.page}
                key={`page-content-${idx}`}
                ref={element => this[`${wrapper}${idx}`] = element}
              >
                <canvas
                  ref={element => this[`${prePage}${idx}`] = element}
                  className={styles.layer}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

export default index
