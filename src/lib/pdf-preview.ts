const PDF_URL_REVOKE_DELAY_MS = 10 * 60 * 1_000

function preparePreviewWindow(title: string) {
  const previewWindow = window.open("about:blank", "_blank")

  if (!previewWindow) {
    throw new Error("O navegador bloqueou a nova aba. Permita pop-ups para visualizar o PDF.")
  }

  previewWindow.opener = null
  previewWindow.document.title = title
  previewWindow.document.body.textContent = "Preparando a visualização do PDF..."
  previewWindow.document.body.style.fontFamily = "system-ui, sans-serif"
  previewWindow.document.body.style.padding = "2rem"

  return previewWindow
}

export async function openPdfPreview(loadPdf: () => Promise<Blob>, title: string) {
  const previewWindow = preparePreviewWindow(title)

  try {
    const responseBlob = await loadPdf()
    const pdfBlob = responseBlob.type.startsWith("application/pdf")
      ? responseBlob
      : new Blob([responseBlob], { type: "application/pdf" })
    const url = URL.createObjectURL(pdfBlob)

    previewWindow.location.replace(url)
    window.setTimeout(() => URL.revokeObjectURL(url), PDF_URL_REVOKE_DELAY_MS)
  } catch (error) {
    previewWindow.close()
    throw error
  }
}
