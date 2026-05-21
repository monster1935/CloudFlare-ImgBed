export interface FileUrls {
  url: string
  markdown: string
  html: string
  bbcode: string
}

export function buildFileUrl(filename: string, url: string): FileUrls {
  return {
    url,
    markdown: `![${filename}](${url})`,
    html: `<img src="${url}" alt="${filename}" />`,
    bbcode: `[img]${url}[/img]`,
  }
}

export function getUrlByFormat(urls: FileUrls, format: string): string {
  switch (format) {
    case 'markdown':
      return urls.markdown
    case 'html':
      return urls.html
    case 'bbcode':
      return urls.bbcode
    default:
      return urls.url
  }
}
