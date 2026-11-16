import unittest

from PIL import Image

from tools.imaging import white_to_transparent


def reference(image):
    """The original pixel-by-pixel rule the fast version must reproduce exactly."""
    rgba = image.convert("RGBA")
    pixels = [
        (255, 255, 255, 0) if r > 250 and g > 250 and b > 250 else (r, g, b, a)
        for r, g, b, a in rgba.get_flattened_data()
    ]
    rgba.putdata(pixels)
    return rgba


class WhiteToTransparentTest(unittest.TestCase):
    def test_pixels_around_the_threshold(self):
        colors = [
            (255, 255, 255), (251, 251, 251), (250, 250, 250), (251, 251, 250),
            (250, 255, 255), (255, 250, 255), (0, 0, 0), (200, 30, 30), (251, 252, 253),
        ]
        image = Image.new("RGB", (len(colors), 1))
        image.putdata(colors)
        result = white_to_transparent(image)
        self.assertEqual(result.mode, "RGBA")
        self.assertEqual(
            list(result.get_flattened_data()),
            [
                (255, 255, 255, 0), (255, 255, 255, 0), (250, 250, 250, 255), (251, 251, 250, 255),
                (250, 255, 255, 255), (255, 250, 255, 255), (0, 0, 0, 255), (200, 30, 30, 255),
                (255, 255, 255, 0),
            ],
        )

    def test_matches_the_reference_for_every_grey_and_for_other_modes(self):
        greys = Image.new("L", (256, 1))
        greys.putdata(list(range(256)))
        self.assertEqual(white_to_transparent(greys).tobytes(), reference(greys).tobytes())
        for mode, color in (("1", 1), ("RGBA", (255, 255, 255, 128)), ("RGBA", (10, 10, 10, 128))):
            image = Image.new(mode, (3, 2), color)
            self.assertEqual(white_to_transparent(image).tobytes(), reference(image).tobytes())

    def test_does_not_modify_the_input(self):
        image = Image.new("RGBA", (2, 2), (255, 255, 255, 255))
        white_to_transparent(image)
        self.assertEqual(image.getpixel((0, 0)), (255, 255, 255, 255))


if __name__ == "__main__":
    unittest.main()
