"use client";

import { AtSign, Phone, User } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Field, FieldLabel } from "@/components/atoms/field";
import { Form } from "@/components/atoms/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/atoms/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { classifySentiment, getSentiment } from "@/services/sentiment/lib";
import { type Placeholder, placeholders } from "./placeholders";
import { SentimentIcon } from "./sentiment-icon";

interface ContactFormProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}
export const ContactForm: React.FC<ContactFormProps> = ({ onSubmit }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [sentiment, setSentiment] = useState<
    "POSITIVE" | "NEGATIVE" | "UH-OH" | "NEUTRAL" | null
  >(null);
  const [placeholder, setPlaceholder] = useState<Placeholder>();

  useEffect(() => {
    if (textAreaRef.current) {
      let timeoutId: NodeJS.Timeout;

      const handleInput = (e: InputEvent) => {
        const textAreaValue = (e.target as HTMLTextAreaElement).value;
        clearTimeout(timeoutId);
        if (!textAreaValue.trim()) {
          setSentiment(null);
          return;
        }
        timeoutId = setTimeout(() => {
          if (!textAreaValue.trim()) {
            setSentiment(null);
            return;
          }

          getSentiment(textAreaValue)
            .then((data) => {
              setSentiment(classifySentiment(data));
            })
            .catch((e) => {
              if (process.env.NODE_ENV === "development") {
                console.error("Error classifying sentiment:", e);
              }
              console.error("🥸");
            });
        }, 300);
      };

      textAreaRef.current.addEventListener("input", handleInput);

      return () => {
        if (textAreaRef.current) {
          textAreaRef.current.removeEventListener("input", handleInput);
        }
        clearTimeout(timeoutId);
      };
    }
  }, []);

  useLayoutEffect(() => {
    const randomPlaceholder =
      placeholders[Math.floor(Math.random() * placeholders.length)];

    const intervalId = setInterval(() => {
      setPlaceholder((prev) => {
        if (!prev) {
          return {
            name: randomPlaceholder.name.slice(0, 1),
            email: randomPlaceholder.email.slice(0, 1),
            text: randomPlaceholder.text.slice(0, 1),
          };
        }

        const nextName = randomPlaceholder.name.slice(0, prev.name.length + 1);
        const nextEmail = randomPlaceholder.email.slice(
          0,
          prev.email.length + 1,
        );
        const nextText = randomPlaceholder.text.slice(0, prev.text.length + 1);

        if (
          nextName === prev.name &&
          nextEmail === prev.email &&
          nextText === prev.text
        ) {
          clearInterval(intervalId);
          return prev;
        }

        return {
          name: nextName,
          email: nextEmail,
          text: nextText,
        };
      });
    }, 20);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <h1 className="text-3xl">Let's Talk</h1>
      <Card className="my-8">
        <CardHeader>
          <CardTitle>Send me a message</CardTitle>
          <CardDescription>You know you want to.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form className="flex w-full flex-wrap gap-4" onSubmit={onSubmit}>
            <div className="flex w-full flex-col gap-4 md:max-w-64">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    type="text"
                    autoComplete="name"
                    placeholder={placeholder?.name}
                  />
                  <InputGroupAddon>
                    <User aria-hidden="true" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    type="email"
                    autoComplete="email"
                    placeholder={placeholder?.email}
                  />
                  <InputGroupAddon>
                    <AtSign aria-hidden="true" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel>Phone Number</FieldLabel>
                <InputGroup>
                  <InputGroupInput type="tel" autoComplete="tel" />
                  <InputGroupAddon>
                    <Phone aria-hidden="true" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </div>

            <Field className="flex-1">
              <FieldLabel>Whatcha got?</FieldLabel>
              <InputGroup className="flex-1">
                <InputGroupTextarea
                  id="contact-message"
                  spellCheck={false}
                  ref={textAreaRef}
                  placeholder={placeholder?.text}
                  textAreaProps={{ className: "grow" }}
                  size="lg"
                />
                <InputGroupAddon align="block-end" className="justify-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <SentimentIcon sentiment={sentiment} />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8} align="end">
                      {sentiment === "NEUTRAL" && "Nothing much to say, huh?"}
                      {sentiment === "POSITIVE" &&
                        "Ooh, I like that. I like that a lot."}
                      {sentiment === "NEGATIVE" &&
                        "Hmm, that doesn't sound good."}
                      {sentiment === "UH-OH" &&
                        "You talk to your momma with that mouth?"}
                      {!sentiment && "It's ok. Let it all out."}
                    </TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};
