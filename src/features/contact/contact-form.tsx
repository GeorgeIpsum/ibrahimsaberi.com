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
import { LoadingText } from "@/components/text";
import { cn } from "@/css/lib";
import { randomArrayMember } from "@/utils/rand";
import { type Placeholder, placeholders } from "./placeholders";
import { SentimentTooltip } from "./sentiment-tooltip";
import { attemptContactFormSubmission } from "./submit-contact-form";

const MAX_TEXTAREA_LENGTH = 2048;
const MIN_TEXTAREA_LENGTH = 16;
const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

interface ContactFormProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}
export const ContactForm: React.FC<ContactFormProps> = ({ onSubmit }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [placeholder, setPlaceholder] = useState<Placeholder>();
  const [isSubmitting, setIsSubmitting] = useState(true);
  const [textAreaValue, setTextAreaValue] = useState("");
  const [loadingText, setLoadingText] = useState("Submitting");

  const textAreaLength = textAreaValue.length;

  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    const handleInput = (e: InputEvent) => {
      setTextAreaValue((e.target as HTMLTextAreaElement).value);
    };
    el.addEventListener("input", handleInput);
    return () => el.removeEventListener("input", handleInput);
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
    const handlePageUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();

      // I wish this worked
      return "WHAT ARE YOU DOING?????????????????????? BRO!!!!!!!!!!!!!!!!!!!!!!!";
    };
    window.addEventListener("beforeunload", handlePageUnload);
    try {
      if (onSubmit) {
        await onSubmit(e);
      }
      await attemptContactFormSubmission((done) => {
        if (!done) {
          setLoadingText(randomArrayMember(LOADING_TEXT));
        }
      });
      console.log("Form submitted successfully");
    } catch (e) {
      if (e instanceof Error && e.message === "ERR_TASK_COMPLETE_UH_OH") {
        // TODO: actually submit something idk
      }
    } finally {
      setIsSubmitting(false);
      setLoadingText("Submitting");
    }
    window.removeEventListener("beforeunload", handlePageUnload);
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
                      inputMode="email"
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
                      inputMode="tel"
                      pattern={phoneRegex.source}
                      autoComplete="tel"
                      minLength={10}
                      maxLength={15}
                      placeholder="+1 (opt)-ion-ally"
                      onBeforeInput={(e) => {
                        const data = (e.nativeEvent as InputEvent).data;
                        if (data && phoneRegex.test(data)) {
                          e.preventDefault();
                        }
                      }}
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
                    onBlur={(e) => {
                      if (e.target.value.trim().length < MIN_TEXTAREA_LENGTH) {
                        const charSpan = document.getElementById(
                          "contact-form-message-char-count",
                        );
                        const charSpanContainer = document.getElementById(
                          "contact-form-message-char-count-container",
                        );
                        if (charSpan) {
                          charSpan.style.color =
                            "var(--destructive-foreground)";
                        }
                        charSpanContainer?.classList.add("animate-shake");

                        setTimeout(() => {
                          charSpanContainer?.classList.remove("animate-shake");
                          if (charSpan) {
                            charSpan.style.color = "";
                          }
                        }, 1300);
                      }
                    }}
                  />
                  <InputGroupAddon
                    align="block-end"
                    className="items-center justify-between gap-2"
                  >
                    <div>
                      <AnimatePresence>
                        {textAreaLength > 0 && (
                          <motion.div
                            id="contact-form-message-char-count-container"
                            className="font-mono text-muted-foreground text-xs transition-colors"
                            layoutId="char-count"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <span
                              id="contact-form-message-char-count"
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
                    <div className="flex size-3">
                      <SentimentTooltip text={textAreaValue} />
                    </div>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              type="submit"
              size="lg"
              className="w-full md:max-w-36"
              loading={isSubmitting}
              loadingIndicator={<LoadingText>{loadingText}</LoadingText>}
              disabled={isSubmitting}
            >
              Submit
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </>
  );
};

const LOADING_TEXT = [
  "Boondongling",
  "Fortifying",
  "Synchronizing",
  "Cranberrying",
  "Sizzling",
  "Snacking",
  "Relaxing",
  "Contemplating",
  "Calculating",
  "Recalculating",
  "Mailing",
  "Emailing",
  "Faxing",
  "Texting",
  "Tweeting",
  "Vimeoing",
];
