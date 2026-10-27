import logging

logger = logging.getLogger(__name__)


class FigureOcr:
    """Printed labels and plot text, which the vision model often misreads."""

    def __init__(self) -> None:
        from rapidocr import RapidOCR

        self._engine = RapidOCR()

    def read(self, image_path: str) -> str:
        try:
            result = self._engine(image_path)
        except Exception as error:
            # A figure without OCR text is still worth describing.
            logger.warning("OCR failed for %s: %s", image_path, error)
            return ""
        texts: tuple[str, ...] = getattr(result, "txts", None) or ()
        return " | ".join(text.strip() for text in texts if text.strip())
