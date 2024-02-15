"use client";

import { useCallback, useState } from "react";
import {
  FieldError,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { capitalCase } from "capital-case";
import { HelpCircleIcon, PlusIcon } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SubmitButtonWrapper } from "@/components/Form";
import { ErrorMessage, Input, Label } from "@/components/Input";
import { toastError, toastSuccess } from "@/components/Toast";
import { SectionHeader, TypographyH3 } from "@/components/Typography";
import { postRequest } from "@/utils/api";
import { isError } from "@/utils/error";
import { ActionType } from "@prisma/client";
import { Modal } from "@/components/Modal";
import {
  updateRuleBody,
  type UpdateRuleBody,
  type UpdateRuleResponse,
} from "@/app/api/user/rules/[id]/validation";
import { actionInputs } from "@/utils/actionType";
import { Select } from "@/components/Select";
import { AlertBasic } from "@/components/Alert";
import { Toggle } from "@/components/Toggle";
import { AI_GENERATED_FIELD_VALUE } from "@/utils/config";
import { Tooltip } from "@/components/Tooltip";

export function RuleModal(props: {
  rule?: UpdateRuleBody;
  closeModal: () => void;
  refetchRules: () => Promise<any>;
}) {
  return (
    <Modal
      isOpen={Boolean(props.rule)}
      hideModal={props.closeModal}
      title="Edit Rule"
      size="4xl"
    >
      {props.rule && (
        <UpdateRuleForm
          rule={props.rule}
          closeModal={props.closeModal}
          refetchRules={props.refetchRules}
        />
      )}
    </Modal>
  );
}

function UpdateRuleForm(props: {
  rule: UpdateRuleBody & { id?: string };
  closeModal: () => void;
  refetchRules: () => Promise<any>;
}) {
  const { closeModal, refetchRules } = props;

  const [editingActionType, setEditingActionType] = useState(false);
  const toggleEdittingActionType = useCallback(
    () => setEditingActionType(!editingActionType),
    [setEditingActionType, editingActionType],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateRuleBody>({
    resolver: zodResolver(updateRuleBody),
    defaultValues: props.rule,
  });

  const { append, remove } = useFieldArray({ control, name: "actions" });

  const onSubmit: SubmitHandler<UpdateRuleBody> = useCallback(
    async (data) => {
      if (!props.rule.id) return;
      const res = await postRequest<UpdateRuleResponse, UpdateRuleBody>(
        `/api/user/rules/${props.rule.id}`,
        data,
      );

      await refetchRules();

      if (isError(res)) {
        console.error(res);
        toastError({ description: `There was an error updating the rule.` });
      } else {
        toastSuccess({ description: `Saved!` });
        closeModal();
      }
    },
    [props.rule.id, closeModal, refetchRules],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mt-4">
        <AlertBasic
          title="Instructions"
          description={props.rule.instructions}
          icon={null}
        />

        <div className="mt-4">
          <Input
            type="text"
            name="Name"
            label="Rule name"
            registerProps={register("name")}
            error={errors.name}
          />
        </div>
      </div>

      <TypographyH3 className="mt-6">Actions</TypographyH3>

      <div className="mt-4 space-y-4">
        {watch("actions")?.map((action, i) => {
          return (
            <Card key={i}>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  {editingActionType ? (
                    <Select
                      name={`actions.${i}.type`}
                      label="Action type"
                      options={Object.keys(ActionType).map((action) => ({
                        label: capitalCase(action),
                        value: action,
                      }))}
                      registerProps={register(`actions.${i}.type`)}
                      error={
                        errors["actions"]?.[i]?.["type"] as
                          | FieldError
                          | undefined
                      }
                    />
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={toggleEdittingActionType}
                    >
                      <SectionHeader>{capitalCase(action.type)}</SectionHeader>
                    </div>
                  )}

                  <button
                    type="button"
                    className="text-xs hover:text-red-500"
                    onClick={() => remove(i)}
                  >
                    Remove
                  </button>
                </div>
                <div className="col-span-3 space-y-4">
                  {actionInputs[watch(`actions.${i}.type`)].fields.map(
                    (field) => {
                      const isAiGenerated =
                        watch(`actions.${i}.${field.name}`) ===
                        AI_GENERATED_FIELD_VALUE;

                      return (
                        <div key={field.label}>
                          <div className="flex items-center justify-between">
                            <Label name={field.name} label={field.label} />
                            <div className="flex items-center space-x-2">
                              <Tooltip content="If enabled the AI will generate this value in real time when processing your emails. If you want the same value each time then set it here and disable real-time AI generation.">
                                <HelpCircleIcon className="h-5 w-5 cursor-pointer" />
                              </Tooltip>
                              <Toggle
                                name={`actions.${i}.${field.name}`}
                                label="AI generated"
                                enabled={isAiGenerated}
                                onChange={(enabled) => {
                                  setValue(
                                    `actions.${i}.${field.name}`,
                                    enabled ? AI_GENERATED_FIELD_VALUE : "",
                                  );
                                }}
                              />
                            </div>
                          </div>
                          {isAiGenerated ? (
                            <input
                              className="mt-2 block w-full flex-1 rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 sm:text-sm"
                              type="text"
                              disabled
                              value=""
                              placeholder="AI Generated"
                            />
                          ) : (
                            <>
                              {field.textArea ? (
                                <textarea
                                  className="mt-2 block w-full flex-1 whitespace-pre-wrap rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                                  rows={3}
                                  {...register(`actions.${i}.${field.name}`)}
                                />
                              ) : (
                                <input
                                  className="mt-2 block w-full flex-1 rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                                  type="text"
                                  {...register(`actions.${i}.${field.name}`)}
                                />
                              )}
                            </>
                          )}
                          {errors["actions"]?.[i]?.[field.name]?.message ? (
                            <ErrorMessage
                              message={
                                errors["actions"]?.[i]?.[field.name]?.message!
                              }
                            />
                          ) : null}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!watch("actions")?.length && (
        <div className="mt-8 flex justify-center">
          <div className="text-gray-700">No actions</div>
        </div>
      )}
      <div className="mt-4">
        <Button
          color="white"
          full
          onClick={() => append({ type: ActionType.LABEL })}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Action
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-end space-x-2">
        <Tooltip content="Enable to run this rule on all emails, including threads. When disabled the rule only runs on individual emails.">
          <HelpCircleIcon className="h-5 w-5 cursor-pointer" />
        </Tooltip>

        <Toggle
          name="runOnThreads"
          label="Run on threads"
          enabled={watch("runOnThreads") || false}
          onChange={(enabled) => {
            setValue("runOnThreads", enabled);
          }}
        />
      </div>

      <div className="flex justify-end">
        <SubmitButtonWrapper>
          <Button type="submit" loading={isSubmitting}>
            Save
          </Button>
        </SubmitButtonWrapper>
      </div>
    </form>
  );
}
