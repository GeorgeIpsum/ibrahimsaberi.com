"use client";

import { AtSign, Phone, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Field, FieldError, FieldLabel } from "@/components/atoms/field";
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
import { cn } from "@/css/lib";
import { classifySentiment, getSentiment } from "@/services/sentiment/lib";
import { type Placeholder, placeholders } from "./placeholders";
import { SentimentIcon } from "./sentiment-icon";
import { attemptContactFormSubmission } from "./submit-contact-form";

const MAX_TEXTAREA_LENGTH = 2048;
const MIN_TEXTAREA_LENGTH = 16;

interface ContactFormProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}
export const ContactForm: React.FC<ContactFormProps> = ({ onSubmit }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [sentiment, setSentiment] = useState<
    "POSITIVE" | "NEGATIVE" | "UH-OH" | "NEUTRAL" | null
  >(null);
  const [placeholder, setPlaceholder] = useState<Placeholder>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [textAreaLength, setTextAreaLength] = useState(0);

  useEffect(() => {
    if (textAreaRef.current) {
      let timeoutId: NodeJS.Timeout;

      const handleInput = (e: InputEvent) => {
        const textAreaValue = (e.target as HTMLTextAreaElement).value;
        setTextAreaLength(textAreaValue.length);
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

  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(e);
      }
      await attemptContactFormSubmission(placeholder);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl">Let's Talk</h1>
      <Card className="my-8">
        <Form onSubmit={submitForm}>
          <CardHeader>
            <CardTitle>Send me a message</CardTitle>
            <CardDescription>You know you want to.</CardDescription>
          </CardHeader>
          <CardContent className="md:pt-0">
            <div className="flex flex-col gap-8 md:flex-row">
              <div className="flex w-full flex-col gap-4 md:max-w-64 md:shrink-0">
                <Field name="name" disabled={isSubmitting}>
                  <FieldLabel>Name</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      type="text"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={64}
                      placeholder={placeholder?.name}
                    />
                    <InputGroupAddon>
                      <User aria-hidden="true" />
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError className="text-xs" />
                </Field>
                <Field name="email" disabled={isSubmitting}>
                  <FieldLabel>Email</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      type="email"
                      autoComplete="email"
                      required
                      minLength={3}
                      placeholder={placeholder?.email}
                    />
                    <InputGroupAddon>
                      <AtSign aria-hidden="true" />
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError className="text-xs" />
                </Field>
                <Field name="phone" disabled={isSubmitting}>
                  <FieldLabel>Phone Number</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      type="tel"
                      autoComplete="tel"
                      minLength={10}
                      maxLength={15}
                      placeholder="+1 (opt)-ion-ally"
                    />
                    <InputGroupAddon>
                      <Phone aria-hidden="true" />
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError className="text-xs" />
                </Field>
              </div>

              <Field
                name="message"
                className="w-full md:shrink"
                disabled={isSubmitting}
              >
                <FieldLabel>Whatcha got?</FieldLabel>
                <InputGroup className="flex-1">
                  <InputGroupTextarea
                    id="contact-message"
                    spellCheck={false}
                    required
                    minLength={MIN_TEXTAREA_LENGTH}
                    maxLength={MAX_TEXTAREA_LENGTH}
                    ref={textAreaRef}
                    placeholder={placeholder?.text}
                    textAreaProps={{
                      className: "grow wrap-anywhere",
                      wrap: "hard",
                    }}
                    size="lg"
                  />
                  <InputGroupAddon
                    align="block-end"
                    className="items-center justify-between gap-2"
                  >
                    <div>
                      <AnimatePresence>
                        {textAreaLength > 0 && (
                          <motion.div
                            className="font-mono text-muted-foreground text-xs transition-colors"
                            layoutId="char-count"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <span
                              className={cn("transition-colors", {
                                "text-destructive-foreground":
                                  textAreaLength > MAX_TEXTAREA_LENGTH,
                                "text-muted-foreground":
                                  textAreaLength < MIN_TEXTAREA_LENGTH,
                                "text-primary":
                                  textAreaLength >= MIN_TEXTAREA_LENGTH &&
                                  textAreaLength <= MAX_TEXTAREA_LENGTH,
                              })}
                            >
                              {textAreaLength
                                .toString()
                                .padStart(
                                  MAX_TEXTAREA_LENGTH.toString().length,
                                  "0",
                                )}
                            </span>
                            <span>/</span>
                            <span>{MAX_TEXTAREA_LENGTH}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              type="submit"
              size="lg"
              className="w-full md:max-w-24"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Send
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </>
  );
};
