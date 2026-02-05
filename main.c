#include <stdio.h>
#include <stdlib.h>

int main(void) {

  char name[] = "";
  printf("What is your name? \n Name: ");
  scanf("%s", &name);
  
  printf("Welcome! %s\n", name);

  printf("Press Enter to continue...");

  system("pause");

  return 0;
}
