"""Image helpers shared by the tools."""

from PIL import Image, ImageChops

# A pixel counts as background when red, green and blue are all above this.
WHITE_THRESHOLD = 250

_KEEP_LUT = [0 if value > WHITE_THRESHOLD else 255 for value in range(256)]


def white_to_transparent(image):
    """Return an RGBA copy of `image` with near-white pixels made fully transparent.

    Near-white pixels become (255, 255, 255, 0); every other pixel is unchanged.
    The work is done with whole-channel operations instead of a Python loop over
    pixels, which matters for 300 dpi pages (about 8.7 million pixels for A4).
    """
    rgba = image.convert("RGBA")
    red, green, blue, _alpha = rgba.split()
    # The darkest of the three channels is above the threshold exactly when all three are.
    darkest = ImageChops.darker(ImageChops.darker(red, green), blue)
    keep = darkest.point(_KEEP_LUT)  # 255 where the pixel is kept, 0 where it is background
    background = Image.new("RGBA", rgba.size, (255, 255, 255, 0))
    return Image.composite(rgba, background, keep)
