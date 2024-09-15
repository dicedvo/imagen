import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  ColorArea,
  ColorThumb,
  Label,
  ColorSlider,
  SliderOutput,
  SliderTrack,
  parseColor,
} from "react-aria-components";
import { ColorTranslator } from "colortranslator";
import { useEffect, useState } from "react";

const hslValue = (value: string) => {
  const hslValue = ColorTranslator.toHSLObject(value);
  return `hsl(${hslValue.H}, ${hslValue.S}%, ${hslValue.L}%)`;
};

export default function ColorPicker({
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [currentValue, setCurrentValue] = useState(parseColor(hslValue(value)));
  const [currentValueHex, setCurrentValueHex] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const cvHex = currentValue.toString("hex");
    if (currentValueHex === cvHex) return;
    setCurrentValueHex(currentValue.toString("hex"));
  }, [currentValue, currentValueHex]);

  useEffect(() => {
    try {
      setCurrentValue(parseColor(hslValue(currentValueHex)));
    } catch (e) {
      console.error(e);
    }
  }, [currentValueHex]);

  useEffect(() => {
    if (!isOpen) {
      onChange(currentValue.toString("hex"));
    }
  }, [isOpen]);

  return (
    <div className="flex flex-row w-full">
      <div
        className="h-10 w-10 rounded-md"
        style={{ backgroundColor: value }}
      ></div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="flex-1 pl-2">
            <Input
              type="text"
              value={value}
              className="w-full"
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </PopoverTrigger>

        <PopoverContent align="start" side="bottom">
          <div className="flex flex-col space-y-2">
            <ColorArea value={currentValue} onChange={setCurrentValue}>
              <ColorThumb />
            </ColorArea>

            <ColorSlider
              channel="hue"
              value={currentValue}
              onChange={setCurrentValue}
            >
              <Label />
              <SliderOutput />
              <SliderTrack>
                <ColorThumb />
              </SliderTrack>
            </ColorSlider>

            <ColorSlider
              channel="saturation"
              value={currentValue}
              onChange={setCurrentValue}
            >
              <Label />
              <SliderOutput />
              <SliderTrack>
                <ColorThumb />
              </SliderTrack>
            </ColorSlider>

            <ColorSlider
              channel="lightness"
              value={currentValue}
              onChange={setCurrentValue}
            >
              <Label />
              <SliderOutput />
              <SliderTrack>
                <ColorThumb />
              </SliderTrack>
            </ColorSlider>

            <div className="flex flex-col space-y-1 w-full">
              <label htmlFor="hexValue">Hex Value</label>
              <Input
                type="text"
                value={currentValueHex}
                className="w-full"
                onChange={(e) => setCurrentValueHex(e.target.value)}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
